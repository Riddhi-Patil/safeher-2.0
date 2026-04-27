import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BASE_URL, getCurrentUser, getToken } from '../utils/auth';
import { theme } from '../utils/theme';

const HISTORY_KEY = 'sosHistory';

const LiveSOSModal = ({ navigation }) => {
  const [loc, setLoc] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [locationString, setLocationString] = useState('');
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Flash animation
  useEffect(() => {
    const flashSequence = Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(flashAnim, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: false,
      }),
    ]);

    Animated.loop(flashSequence, { iterations: -1 }).start();
    
    return () => flashAnim.stopAnimation();
  }, []);

  // Load contacts
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('trustedContacts');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log("[LiveSOS] Loaded contacts for SMS:", parsed.length);
          setContacts(parsed);
        }
      } catch (err) {
        console.error("[LiveSOS] Failed to load contacts", err);
      }
    })();
  }, []);

  // SOS activation
  useEffect(() => {
    let intervalId;
    
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // Get location once immediately
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const newLoc = { lat, lon };
          
          setLoc(newLoc);
          setLocationString(`https://www.google.com/maps?q=${lat},${lon}`);
          
          // 1. Send SMS to Trusted Contacts (only once at start)
          // Note: We need to make sure contacts are loaded. 
          // Since useEffect for contacts might run after this, we fetch them again here to be safe.
          const stored = await AsyncStorage.getItem('trustedContacts');
          const contactsList = stored ? JSON.parse(stored) : [];
          if (contactsList.length > 0) {
            sendSOSMessages(lat, lon, contactsList);
          } else {
            console.log("[LiveSOS] No contacts found to send SMS");
          }
          
          // 2. Alert Nearby Users & Save History
          const user = await getCurrentUser();
          const authToken = await getToken();

          const extractId = (u) => {
            if (!u) return null;
            if (typeof u === 'string') return u;
            if (u.id && typeof u.id === 'string') return u.id;
            if (u._id) {
              if (typeof u._id === 'string') return u._id;
              if (u._id.$oid) return u._id.$oid;
              return u._id.toString();
            }
            return null;
          };

          const userId = extractId(user);
          
          // Save a history event
          const evt = { id: Date.now(), timestamp: Date.now(), location: newLoc };
          try {
            const historyRaw = await AsyncStorage.getItem(HISTORY_KEY);
            const history = historyRaw ? JSON.parse(historyRaw) : [];
            history.unshift(evt);
            await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
          } catch (e) {}

          // Call community SOS API
          if (userId) {
            console.log(`[LiveSOS] Calling community SOS API for user ${userId}...`);
            console.log(`[LiveSOS] Payload:`, { latitude: lat, longitude: lon, userId: userId });
            await fetch(`${BASE_URL}/sos/community`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
              body: JSON.stringify({ latitude: lat, longitude: lon, userId: userId }),
            })
            .then(res => res.json())
            .then(data => {
              console.log("[LiveSOS] Community SOS API response:", data);
              const count = data.nearbyCount || data.sentTo || 0;
              console.log(`[LiveSOS] Nearby users notified: ${count}`);
              
              if (count > 0) {
                Alert.alert("SOS Sent", `Your alert has been sent to ${count} nearby users.`);
              } else {
                Alert.alert("SOS Sent", "Alert sent, but no nearby users with active tokens were found.");
              }
            })
            .catch(e => console.error("[LiveSOS] Community SOS API error", e));
          }

          // 3. Start interval to update location on server every 15 seconds (more frequent during SOS)
          intervalId = setInterval(async () => {
            try {
              const currentPos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
              const cLat = currentPos.coords.latitude;
              const cLon = currentPos.coords.longitude;
              
              const extractId = (u) => {
                if (!u) return null;
                if (typeof u === 'string') return u;
                if (u.id && typeof u.id === 'string') return u.id;
                if (u._id) {
                  if (typeof u._id === 'string') return u._id;
                  if (u._id.$oid) return u._id.$oid;
                  return u._id.toString();
                }
                return null;
              };

              const userId = extractId(user);
              
              if (userId) {
                console.log(`[LiveSOS] Updating location during SOS: Lat ${cLat}, Lon ${cLon}`);
                await fetch(`${BASE_URL}/users/updateLocation`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                  },
                  body: JSON.stringify({ userId: userId, latitude: cLat, longitude: cLon }),
                })
                .then(res => res.json())
                .then(data => console.log("[LiveSOS] Location update success:", data))
                .catch(e => console.error("[LiveSOS] Location update failed:", e));
              }
            } catch (e) {
              console.error("[LiveSOS] Interval location update error:", e);
            }
          }, 15000);
        }
      } catch (err) {
        console.error('[LiveSOS] Activation error', err);
      }
    })();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
  
  // Send SOS messages to trusted contacts
  const sendSOSMessages = async (lat, lon, contactsList) => {
    const targetContacts = contactsList || contacts;
    if (!targetContacts || targetContacts.length === 0) return;
    
    const locationUrl = `https://www.google.com/maps?q=${lat},${lon}`;
    const message = `EMERGENCY SOS ALERT: Help me, I'm in danger! My current location: ${locationUrl}`;
    
    try {
      const isAvailable = await SMS.isAvailableAsync();
      const phoneNumbers = targetContacts.map(c => c.phone).filter(p => !!p);
      
      if (isAvailable && phoneNumbers.length > 0) {
        console.log("[LiveSOS] Sending SMS to:", phoneNumbers);
        await SMS.sendSMSAsync(phoneNumbers, message);
      } else if (phoneNumbers.length > 0) {
        console.log("[LiveSOS] SMS unavailable, using Linking fallback");
        for (const phone of phoneNumbers) {
          const url = `sms:${phone}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`;
          await Linking.openURL(url).catch(() => {});
        }
      }
    } catch (err) {
      console.error("[LiveSOS] SMS Error", err);
    }
  };

  const cancel = () => navigation.goBack();
  
  const endSOS = () => {
    Alert.alert(
      "End SOS Mode",
      "Are you sure you want to end SOS mode?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "End SOS", style: "destructive", onPress: () => navigation.goBack() }
      ]
    );
  };

  // Background color animation for flashing red effect
  const backgroundColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e74c3c', '#ff0000']
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}> 
      <>
        <Text style={styles.title}>SOS Active</Text>
        <Text style={styles.description}>
          Emergency alert sent to {contacts.length} trusted contacts.
          {locationString ? '\n\nSharing your live location.' : ''}
        </Text>
        {locationString && (
          <View style={styles.locationBox}>
            <Text style={styles.locationText}>
              Your location is being shared every 10 seconds
            </Text>
          </View>
        )}
        <TouchableOpacity style={styles.endButton} onPress={endSOS}>
          <Text style={styles.endText}>End SOS</Text>
        </TouchableOpacity>
      </>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 16,
    textAlign: 'center',
  },
  countdown: { 
    fontSize: 36, 
    color: '#fff', 
    marginBottom: 16,
    fontWeight: 'bold',
  },
  description: { 
    fontSize: 18, 
    color: '#fff', 
    textAlign: 'center', 
    marginBottom: 24,
    lineHeight: 24,
  },
  locationBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  cancelButton: { 
    backgroundColor: '#fff', 
    paddingVertical: 16, 
    paddingHorizontal: 32, 
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cancelText: { 
    color: theme.colors.danger, 
    fontWeight: '700',
    fontSize: 18,
  },
  endButton: { 
    backgroundColor: '#fff', 
    paddingVertical: 16, 
    paddingHorizontal: 32, 
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  endText: { 
    color: theme.colors.danger, 
    fontWeight: '700',
    fontSize: 18,
  },
});

export default LiveSOSModal;
