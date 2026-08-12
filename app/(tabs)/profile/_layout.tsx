// app/(tabs)/profile/_layout.tsx
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="published" options={{ headerTitle: 'Published by You', headerBackTitle: 'Profile' }} />
      <Stack.Screen name="quoted-in" options={{ headerTitle: 'You were Quoted in', headerBackTitle: 'Profile' }} />
      <Stack.Screen name="settings" options={{ headerTitle: 'Account Settings' }} />
      <Stack.Screen name="edit" options={{ headerTitle: 'Edit Profile', headerBackTitle: 'Profile' }} />
      
      <Stack.Screen 
        name="quote/[id]" 
        options={{ 
          headerTitle: 'Quote',
          headerBackTitle: 'Back' 
        }} 
      />
    </Stack>
  );
}