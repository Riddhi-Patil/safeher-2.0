import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL, getToken, login as loginUser } from '../utils/auth';
import { registerForPushNotificationsAsync } from '../utils/notifications';

// Simple email regex (good enough for basic validation)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  function validateInputs() {
    const newErrors = { email: '', password: '' };
    if (!email.trim()) newErrors.email = 'Email is required.';
    else if (!emailRegex.test(email.trim())) newErrors.email = 'Enter a valid email address.';

    if (!password) newErrors.password = 'Password is required.';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';

    setErrors(newErrors);
    // return true if no errors
    return !newErrors.email && !newErrors.password;
  }

  async function handleLogin() {
    // first validate
    if (!validateInputs()) return;

    // show loading
    setLoading(true);

    try {
      const result = await loginUser({ email: email.trim(), password });
      if (result.ok) {
        console.log("Login successful, user:", result.user);
        
        // Navigate immediately
        navigation.navigate('Main');

        // Setup push token in the background
        (async () => {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            console.log("Push token obtained after login:", token);
            const authToken = await getToken();
            try {
              const res = await fetch(`${BASE_URL}/users/savePushToken`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                },
                body: JSON.stringify({ userId: result.user?.id, token }),
              });
              if (!res.ok) console.error("savePushToken API error status:", res.status);
            } catch (err) {
              console.error("Failed to save push token after login:", err.message);
            }
          }
        })();
      } else {
        Alert.alert('Login failed', result.error || 'Incorrect email or password.');
      }
    } catch (err) {
      Alert.alert('Something went wrong', 'Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = emailRegex.test(email.trim()) && password.length >= 6;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Login</Text>

          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={text => setEmail(text)}
              onBlur={validateInputs}
              style={styles.input}
            />
            {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={text => setPassword(text)}
              onBlur={validateInputs}
              style={styles.input}
            />
            {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.button, !isFormValid || loading ? styles.buttonDisabled : null]}
            onPress={handleLogin}
            disabled={!isFormValid || loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Don't have an account? Register</Text>
            </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 60,
    paddingBottom: 40
  },
  title: { fontSize: 28, fontWeight: '700', color: '#6b46c1', marginBottom: 24 },
  inputWrapper: { width: '100%', marginBottom: 12 },
  input: {
    width: '100%',
    borderRadius: 12,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    color: '#000'
  },
  error: { color: '#c53030', marginTop: 6, marginLeft: 6 },
  button: {
    width: '100%',
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 40,
    backgroundColor: '#6b46c1',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700' },
  registerLink: { marginTop: 18 },
  registerText: { color: '#6b46c1' }
});