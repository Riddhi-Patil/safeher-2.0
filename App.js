import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import ReactNative, { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

// Set notification handler early
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

import 'react-native-gesture-handler';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import critical screens directly to avoid lazy-loading delays/white screens
import CheckInScreen from './src/screens/CheckInScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import HomeScreen from './src/screens/HomeScreen';
import IncomingCallScreen from './src/screens/IncomingCallScreen';
import LiveSOSModal from './src/screens/LiveSOSModal';
import LoginScreen from './src/screens/LoginScreen';
import MapScreen from './src/screens/MapScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import OutgoingCallScreen from './src/screens/OutgoingCallScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SOSScreen from './src/screens/SOSScreen';
import SplashScreen from './src/screens/SplashScreen';

// Theme configuration
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6C4AE2',
    accent: '#FF5E8A',
    background: '#FFF5FA',
    text: '#321B5D',
    error: '#FF5E8A',
  }
};

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#777',
        tabBarStyle: {
          height: 80,
          paddingTop: 8,
          paddingBottom: 14,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarItemStyle: { paddingVertical: 4 },
        tabBarLabelStyle: { fontSize: 12, paddingBottom: 0 },
        tabBarIcon: ({ color }) => {
          const map = {
            Home: 'home',
            Map: 'map',
            'Check-Ins': 'bell',
            Contacts: 'users',
            History: 'clock',
            Settings: 'settings',
          };
          const icon = map[route.name] || 'circle';
          return <Feather name={icon} size={26} color={color} style={{ marginTop: 2 }} />;
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Check-Ins" component={CheckInScreen} />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const navigationRef = ReactNative.useRef(null);
  ReactNative.useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data || {};
      const latitude = data?.latitude;
      const longitude = data?.longitude;
      if (latitude && longitude) {
        navigationRef.current?.navigate('Map', { latitude, longitude });
      }
    });
    return () => {
      sub.remove();
    };
  }, []);
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <Suspense fallback={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5FA' }}>
            <ActivityIndicator size="large" color="#6C4AE2" />
          </View>
        }>
          <NavigationContainer ref={navigationRef}>
            <StatusBar style="auto" />
            <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="SOS" component={SOSScreen} />
              <Stack.Screen name="LiveSOS" component={LiveSOSModal} options={{ presentation: 'modal' }} />
              <Stack.Screen name="IncomingCall" component={IncomingCallScreen} options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="OutgoingCall" component={OutgoingCallScreen} options={{ headerShown: false, presentation: 'modal' }} />
            </Stack.Navigator>
          </NavigationContainer>
        </Suspense>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  floatingSOS: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  sosBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  sosLabel: { color: '#fff', fontWeight: '700' }
});
