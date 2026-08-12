import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Home, User, Plus } from 'lucide-react-native';
import { TouchableOpacity, View, StyleSheet } from 'react-native';

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs 
      screenOptions={{ 
        tabBarActiveTintColor: '#0f172a',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          elevation: 0,
          shadowOpacity: 0,
          height: 60, // Gives a bit more room for the custom button
        },
        tabBarShowLabel: false, // Hides the text under the icons for a cleaner look
      }}
    >
      {/* Feed Tab */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <Home size={28} color={color} />,
        }}
      />
      
      {/* Custom Create Button */}
      <Tabs.Screen
        name="create"
        options={{
          // We override the default tab button completely
          tabBarButton: () => (
            <TouchableOpacity 
              onPress={() => router.push('/create')}
              style={styles.createButtonContainer}
              activeOpacity={0.8}
            >
              <View style={styles.createButton}>
                <Plus size={32} color="#ffffff" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      
      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <User size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createButtonContainer: {
    top: -20, // Lifts the button up outside the standard tab bar
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1, 
  },
  createButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  }
});