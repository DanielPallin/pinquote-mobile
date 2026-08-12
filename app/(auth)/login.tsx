// app/(auth)/login.tsx
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { supabase } from '../../services/supabase';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      Alert.alert('Error', error.message);
    } else if (data.session) {
      router.replace('/');
    }
    
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Check your email for the confirmation link!');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>PinQuo</Text>
        <Text style={styles.subtitle}>Log in or create an account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={handleSignIn} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#022c22" /> : <Text style={styles.primaryBtnText}>Log in</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryBtn} 
          onPress={handleSignUp} 
          disabled={loading}
        >
          <Text style={styles.secondaryBtnText}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 48, fontWeight: '900', color: '#000', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, fontWeight: '700', color: '#64748b', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#f1f5f9', borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '600', marginBottom: 16 },
  primaryBtn: { backgroundColor: '#bbf7d0', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { fontSize: 18, fontWeight: '800', color: '#022c22' },
  secondaryBtn: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  secondaryBtnText: { fontSize: 18, fontWeight: '700', color: '#64748b' }
});