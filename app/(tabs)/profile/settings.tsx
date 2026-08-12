import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../services/supabase';

export default function SettingsScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    console.log('Sign out triggered'); // Good for debugging in your terminal
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      Alert.alert('Error signing out', error.message);
    } else {
      // Manually push the user back to the login screen
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Settings</Text>
      
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

// ... keep your existing styles at the bottom

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#0f172a',
    marginBottom: 32,
  },
  signOutButton: {
    backgroundColor: '#ef4444', // Red color for destructive action
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  }
});