import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL, getCurrentUser, getToken, logout } from '../utils/auth';
import { commonStyles, theme } from '../utils/theme';

const SettingsScreen = ({ navigation }) => {
  const [communityEnabled, setCommunityEnabled] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('communityAlertsEnabled');
        if (raw) setCommunityEnabled(raw === 'true');
      } catch {}
    })();
  }, []);
  const toggleCommunity = async () => {
    const next = !communityEnabled;
    setCommunityEnabled(next);
    try {
      await AsyncStorage.setItem('communityAlertsEnabled', next ? 'true' : 'false');
      
      // Sync with backend
      const user = await getCurrentUser();
      const authToken = await getToken();
      const userId = user?.id || user?._id;
      
      if (userId) {
        console.log(`[Settings] Syncing community alerts (${next}) for user ${userId}`);
        await fetch(`${BASE_URL}/users/savePushToken`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) 
          },
          body: JSON.stringify({ 
            userId: userId, 
            communitySOS: next, // Tell backend if we want alerts
            pushToken: await AsyncStorage.getItem('pushToken') // Send token again to be safe
          }),
        });
      }
    } catch (err) {
      console.error("[Settings] Failed to sync community toggle", err);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Enable Location Sharing</Text>
          <Switch value={true} trackColor={{ false: "#767577", true: theme.colors.primary }} thumbColor={"#f4f3f4"} />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Enable Notifications</Text>
          <Switch value={true} trackColor={{ false: "#767577", true: theme.colors.primary }} thumbColor={"#f4f3f4"} />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Enable Community SOS Alerts</Text>
          <Switch value={communityEnabled} onValueChange={toggleCommunity} trackColor={{ false: "#767577", true: theme.colors.primary }} thumbColor={"#f4f3f4"} />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch value={false} trackColor={{ false: "#767577", true: theme.colors.primary }} thumbColor={"#f4f3f4"} />
        </View>
        
        <TouchableOpacity 
          style={[commonStyles.button, styles.logoutBtn]} 
          onPress={async () => { await logout(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 30,
    alignSelf: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  backButton: {
    marginTop: 30,
    alignItems: 'center',
    paddingBottom: 20
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  logoutBtn: { marginTop: 24 },
  logoutText: { color: '#fff', fontWeight: '700' }
});

export default SettingsScreen;
