import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feed</Text>
      <Text style={styles.subtitle}>You are successfully logged in!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc' 
  },
  title: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: '#0f172a' 
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8
  }
});