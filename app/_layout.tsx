// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      
      <Stack>
        {/* Main Tab Navigation */}
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false 
          }} 
        />
        
        {/* Create Flow (Modal) */}
        <Stack.Screen 
          name="create" 
          options={{ 
            presentation: 'modal',
            headerShown: false,
            gestureEnabled: true, 
          }} 
        />
      </Stack>
    </>
  );
}