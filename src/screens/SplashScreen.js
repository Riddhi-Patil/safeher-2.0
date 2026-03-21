import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { theme, commonStyles } from '../utils/theme';
import { getCurrentUser, BASE_URL } from '../utils/auth';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    // Proactively wake up the Render server as soon as the app starts
    (async () => {
      console.log(`[Splash] Waking up server at ${BASE_URL}...`);
      try {
        await fetch(`${BASE_URL}/health`, { method: 'GET' }).catch(() => {});
      } catch (e) {}
    })();

    // Quick gate: if logged in, go to Main; else Onboarding
    const timer = setTimeout(async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          navigation.replace('Main');
        } else {
          navigation.replace('Onboarding');
        }
      } catch {
        navigation.replace('Onboarding');
      }
    }, 1500); // Increased slightly to give server a tiny head start

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={[commonStyles.container, commonStyles.centerContent]}>
      <Text style={styles.logo}>SafeHer</Text>
      <Text style={styles.tagline}>Because Feeling Safe Shouldn't Be a Privilege</Text>
      <View style={{ marginTop: 40 }}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={{ marginTop: 8, fontSize: 12, color: '#999' }}>Waking up server...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  tagline: {
    fontSize: 18,
    color: theme.colors.accent,
  }
});

export default SplashScreen;