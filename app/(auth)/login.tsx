import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
  UIManager, LayoutAnimation, ScrollView
} from 'react-native';
import { Square, CheckSquare } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { useRouter } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AuthScreen() {
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const toggleAuthMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsLogin(!isLogin);
  };

  const handleSignIn = async () => {
    if (!identifier || !password) {
      Alert.alert('Missing fields', 'Please enter your login details.');
      return;
    }

    setLoading(true);
    let loginEmail = identifier.trim();

    if (!loginEmail.includes('@')) {
      const { data, error } = await supabase.rpc('get_email_from_username', { 
        lookup_username: loginEmail.toLowerCase() 
      });

      if (error || !data) {
        Alert.alert('Login Failed', 'Username not found.');
        setLoading(false);
        return;
      }
      loginEmail = data; 
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
      email: loginEmail, 
      password 
    });
    
    if (authError) {
      Alert.alert('Error', authError.message);
    } else if (authData.session) {
      router.replace('/(tabs)');
    }
    
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!agreedToTerms) {
      Alert.alert('Terms & Conditions', 'You must agree to the Terms and Conditions and Privacy Policy to create an account.');
      return;
    }

    const email = identifier.trim();

    if (!email || !password || !username) {
      Alert.alert('Missing fields', 'Please fill in all the required fields.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please provide a valid email address for registration.');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Invalid Username', 'Username must be at least 3 characters long.');
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          username: username.toLowerCase().replace(/\s+/g, ''),
        }
      }
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Check your email for the confirmation link!');
      toggleAuthMode(); 
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>PinQuo</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Log in to explore quotes' : 'Create Account to explore quotes'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          
          <TextInput
            style={styles.input}
            placeholder={isLogin ? "Email or Username" : "Email"}
            placeholderTextColor="#94a3b8"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType={isLogin ? "default" : "email-address"}
            autoCorrect={false}
          />

          {!isLogin && (
            <View style={styles.expandedFields}>
              <TextInput
                style={styles.input}
                placeholder="Create a username"
                placeholderTextColor="#94a3b8"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {!isLogin && (
            <TouchableOpacity 
              style={styles.termsContainer} 
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.7}
            >
              {agreedToTerms ? (
                <CheckSquare size={20} color="#0f172a" />
              ) : (
                <Square size={20} color="#94a3b8" />
              )}
              <Text style={styles.termsText}>
                By signing up, I agree to the <Text style={styles.linkText}>Terms and Conditions</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.primaryBtn, !isLogin && styles.primaryBtnSignup]} 
            onPress={isLogin ? handleSignIn : handleSignUp} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={isLogin ? "#0f172a" : "#ffffff"} />
            ) : (
              <Text style={[styles.primaryBtnText, !isLogin && styles.primaryBtnTextSignup]}>
                {isLogin ? 'Log in' : 'Create an account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </Text>
          <TouchableOpacity onPress={toggleAuthMode} disabled={loading}>
            <Text style={styles.footerLink}>
              {isLogin ? 'Sign up' : 'Log in'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 48, fontWeight: '900', color: '#0f172a', marginBottom: 8, letterSpacing: -1 },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#64748b' },
  
  formContainer: { width: '100%' },
  expandedFields: { overflow: 'hidden' }, 
  
  input: { 
    backgroundColor: '#f8fafc', 
    borderRadius: 16, 
    padding: 18, 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#0f172a',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  
  termsContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, paddingRight: 16 },
  termsText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#64748b', lineHeight: 20 },
  linkText: { color: '#0f172a', fontWeight: '700' },
  
  primaryBtn: { 
    backgroundColor: '#f1f5f9', 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 
  },
  primaryBtnSignup: {
    backgroundColor: '#0f172a',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  primaryBtnTextSignup: { color: '#ffffff' },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 15, color: '#64748b', fontWeight: '500' },
  footerLink: { fontSize: 15, color: '#0f172a', fontWeight: '800' }
});