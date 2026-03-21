import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';

const MapScreen = ({ route }) => {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const routeLat = route?.params?.latitude;
  const routeLon = route?.params?.longitude;

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setLoading(false);
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation.coords);
      } catch (err) {
        setErrorMsg('Could not fetch current location');
        console.error("[Map] Location fetch error:", err);
      } finally {
        // We stop loading after 2 seconds to show the UI
        setTimeout(() => setLoading(false), 2000);
      }
    })();
  }, []);

  const openInExternalMaps = () => {
    const lat = routeLat || location?.latitude || 28.6139;
    const lon = routeLon || location?.longitude || 77.2090;
    const label = routeLat ? "SOS Alert Location" : "My Location";
    
    // Standard Google Maps URL that works on both iOS and Android
    const browserUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    
    Linking.openURL(browserUrl).catch(err => {
      console.error("[Map] Failed to open external map", err);
      Alert.alert("Error", "Could not open Google Maps.");
    });
  };

  const region = routeLat && routeLon
    ? { latitude: routeLat, longitude: routeLon, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : location
      ? { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
      : { latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  if (loading && !routeLat) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: '#666' }}>Initializing Map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map with crash-prevention */}
      {Platform.OS === 'android' ? (
        <MapView 
          style={styles.map} 
          initialRegion={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
          provider={PROVIDER_GOOGLE}
          onMapReady={() => setMapReady(true)}
          onError={(e) => {
            console.error("[Map] Load Error:", e);
            setErrorMsg("Native map failed to load.");
          }}
        >
          {routeLat && routeLon && (
            <Marker 
              coordinate={{ latitude: routeLat, longitude: routeLon }} 
              title="SOS Alert" 
              pinColor="red"
            />
          )}
        </MapView>
      ) : (
        <View style={[styles.map, styles.center]}>
          <Feather name="map" size={50} color="#ccc" />
          <Text style={{ marginTop: 10, color: '#999' }}>Native Map Placeholder</Text>
        </View>
      )}
      
      <View style={[styles.overlayCard, { top: insets.top + 16 }]}>
        <Text style={styles.title}>SafeHer Map</Text>
        <Text style={styles.subtitle}>
          {routeLat && routeLon 
            ? 'Viewing emergency alert location.' 
            : errorMsg 
              ? errorMsg 
              : 'Your location is being monitored for safety.'}
        </Text>
        
        {/* Fallback / External Maps Button */}
        <TouchableOpacity style={styles.externalButton} onPress={openInExternalMaps}>
          <Feather name="external-link" size={16} color="white" />
          <Text style={styles.externalButtonText}>View in Google Maps</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={async () => {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc.coords);
            Alert.alert("Location Updated", "Position refreshed.");
          }
        }}
      >
        <Feather name="navigation" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  overlayCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  externalButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  externalButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  }
});

export default MapScreen;
