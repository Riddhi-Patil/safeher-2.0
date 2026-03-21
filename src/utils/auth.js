import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const CURRENT_USER_KEY = 'safeher_current_user';
const TOKEN_KEY = 'safeher_token';

// Fallback to the known working URL if app.json is outdated
export const BASE_URL = Constants.expoConfig?.extra?.API_URL || 'https://safeher-vrkv.onrender.com';

/*
// Hard-set local IP for debugging with phone/emulator
// const BASE_URL = 'http://192.168.29.94:5000';
*/

// Debug: log the resolved BASE_URL so we can verify connectivity targets
console.log('[Auth] BASE_URL ->', BASE_URL);

async function storeSession(user, token) {
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function register({ name, email, password }) {
  console.log(`[Auth] Attempting register at: ${BASE_URL}/auth/register`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for Render cold starts

  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      let errorMsg = 'Registration failed';
      try {
        const err = await res.json();
        errorMsg = err.error || err.message || errorMsg;
      } catch (e) {
        // Not JSON, might be HTML 404/500
        errorMsg = `Server error (${res.status})`;
      }
      return { ok: false, error: errorMsg };
    }
    const data = await res.json();
    await storeSession(data.user, data.token);
    return { ok: true, user: data.user };
  } catch (e) {
    if (e.name === 'AbortError') {
      return { ok: false, error: 'Server is waking up from a deep sleep. Please wait another 30 seconds and try again.' };
    }
    return { ok: false, error: `Network error: ${e?.message || e}. Target: ${BASE_URL}` };
  }
}

export async function login({ email, password }) {
  console.log(`[Auth] Attempting login at: ${BASE_URL}/auth/login`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for Render cold starts

  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      let errorMsg = 'Login failed';
      try {
        const err = await res.json();
        errorMsg = err.error || err.message || errorMsg;
      } catch (e) {
        // Not JSON, might be HTML 404/500
        errorMsg = `Server error (${res.status})`;
      }
      return { ok: false, error: errorMsg };
    }
    const data = await res.json();
    await storeSession(data.user, data.token);
    return { ok: true, user: data.user };
  } catch (e) {
    if (e.name === 'AbortError') {
      return { ok: false, error: 'Server is waking up from a deep sleep. Please wait another 30 seconds and try again.' };
    }
    return { ok: false, error: `Network error: ${e?.message || e}. Target: ${BASE_URL}` };
  }
}

export async function logout() {
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getCurrentUser() {
  const raw = await AsyncStorage.getItem(CURRENT_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}