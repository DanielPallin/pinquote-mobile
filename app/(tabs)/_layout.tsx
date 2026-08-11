// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Home, PlusSquare, User } from 'lucide-react-native';

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false, 
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      {/* 1. HOME (Feed) */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          tabBarIcon: ({ color }) => <Home color={color} size={28} /> 
        }} 
      />
      
      {/* 2. THE PLUS BUTTON (Intercepted) */}
      <Tabs.Screen 
        name="create-placeholder" 
        options={{
          tabBarIcon: ({ color }) => <PlusSquare color={color} size={28} />,
          // Vi skriver över standardknappen för att "kapa" klicket
          tabBarButton: (props) => (
            <TouchableOpacity 
              {...props} 
              onPress={() => router.push('../create')}
            />
          )
        }} 
      />
      
      {/* 3. PROFILE */}
      <Tabs.Screen 
        name="profile" 
        options={{ 
          tabBarIcon: ({ color }) => <User color={color} size={28} /> 
        }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    height: 80, // Extra höjd för att hantera iOS "home indicator"
    paddingTop: 12,
  }
});