import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';

const parseCoordinate = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatCoordinate = (value) => {
  if (!Number.isFinite(value)) return 'Unavailable';
  return value.toFixed(5);
};

const MapScreen = ({ route }) => {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const alertCoords = useMemo(() => {
    const latitude = parseCoordinate(route?.params?.latitude);
    const longitude = parseCoordinate(route?.params?.longitude);
    return latitude !== null && longitude !== null ? { latitude, longitude } : null;
  }, [route?.params?.latitude, route?.params?.longitude]);

  const loadCurrentLocation = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission is off. You can still open Google Maps manually.');
        setLocation(null);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(currentLocation.coords);
    } catch (err) {
      console.error('[Map] Location fetch error:', err);
      setErrorMsg('Could not fetch your current location right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  const openInExternalMaps = async (coords, label) => {
    if (!coords?.latitude || !coords?.longitude) {
      Alert.alert('Location unavailable', 'There is no location to open yet.');
      return;
    }

    const browserUrl = `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;

    try {
      await Linking.openURL(browserUrl);
    } catch (err) {
      console.error('[Map] Failed to open external map', err);
      Alert.alert('Error', `Could not open Google Maps for ${label}.`);
    }
  };

  const primaryCoords = alertCoords || location;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Feather name="map-pin" size={28} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>SafeHer Map</Text>
        <Text style={styles.subtitle}>
          {alertCoords
            ? 'Emergency location received. Open it safely in Google Maps.'
            : 'Your location tools are ready. Use Google Maps for stable navigation during the demo.'}
        </Text>
      </View>

      <View style={styles.previewCard}>
        <View style={styles.previewBadge}>
          <Feather name="shield" size={18} color="#fff" />
        </View>
        <Text style={styles.previewTitle}>
          {alertCoords ? 'Emergency Alert Location' : 'Current Location Status'}
        </Text>
        <Text style={styles.previewText}>
          {loading ? 'Getting your latest location...' : errorMsg || 'Location is available and ready to share.'}
        </Text>

        {loading ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loaderText}>Loading location...</Text>
          </View>
        ) : (
          <View style={styles.coordinatesCard}>
            <Text style={styles.coordinatesLabel}>Latitude</Text>
            <Text style={styles.coordinatesValue}>{formatCoordinate(primaryCoords?.latitude)}</Text>
            <Text style={styles.coordinatesLabel}>Longitude</Text>
            <Text style={styles.coordinatesValue}>{formatCoordinate(primaryCoords?.longitude)}</Text>
          </View>
        )}
      </View>

      {alertCoords ? (
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Emergency Alert</Text>
          <Text style={styles.cardText}>
            This app received an SOS location. Open it in Google Maps to show the destination clearly during the presentation.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => openInExternalMaps(alertCoords, 'the SOS alert')}>
            <Feather name="external-link" size={16} color="#fff" />
            <Text style={styles.primaryButtonText}>Open Emergency Location</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>My Location</Text>
        <Text style={styles.cardText}>
          Refresh your current position, then open it in Google Maps if you want full turn-by-turn navigation.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => openInExternalMaps(location, 'your location')}>
          <Feather name="navigation" size={16} color="#fff" />
          <Text style={styles.primaryButtonText}>Open My Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={loadCurrentLocation}>
          <Feather name="refresh-cw" size={16} color={theme.colors.primary} />
          <Text style={styles.secondaryButtonText}>Refresh Location</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f3ff',
  },
  content: {
    paddingHorizontal: 16,
  },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3edff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#666',
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  previewBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  previewText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.9)',
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  loaderText: {
    marginLeft: 10,
    color: '#fff',
    fontWeight: '600',
  },
  coordinatesCard: {
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    padding: 16,
  },
  coordinatesLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  coordinatesValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#666',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  secondaryButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default MapScreen;
