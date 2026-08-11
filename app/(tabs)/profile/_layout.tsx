// app/(tabs)/profile/_layout.tsx
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="published" options={{ headerTitle: 'Published by You', headerBackTitle: 'Profile' }} />
      <Stack.Screen name="quoted-in" options={{ headerTitle: 'You were Quoted in', headerBackTitle: 'Profile' }} />
      <Stack.Screen name="settings" options={{ headerTitle: 'Account Settings' }} />
      
      {/* New dynamic route for a single quote */}
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