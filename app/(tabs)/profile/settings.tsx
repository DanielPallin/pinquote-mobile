// app/(tabs)/profile/settings.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Switch, TouchableOpacity, 
  Alert, ActivityIndicator, ScrollView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, LogOut, AlertTriangle } from 'lucide-react-native';
import { supabase } from '../../../services/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Notification states
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyReactions, setNotifyReactions] = useState(true);
  const [notifyFollowers, setNotifyFollowers] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('notify_comments, notify_reactions, notify_followers') 
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setNotifyComments(data.notify_comments ?? true);
        setNotifyReactions(data.notify_reactions ?? true);
        setNotifyFollowers(data.notify_followers ?? true);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSwitch = async (field: string, value: boolean) => {
    if (!userId) return;
    
    if (field === 'notify_comments') setNotifyComments(value);
    if (field === 'notify_reactions') setNotifyReactions(value);
    if (field === 'notify_followers') setNotifyFollowers(value);

    // Database update
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', userId);

    if (error) {
      Alert.alert('Error', 'Failed to update setting.');
      if (field === 'notify_comments') setNotifyComments(!value);
      if (field === 'notify_reactions') setNotifyReactions(!value);
      if (field === 'notify_followers') setNotifyFollowers(!value);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error signing out', error.message);
    } else {
      router.replace('/');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This action cannot be undone and all your quotes, likes, and followers will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Permanently', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('delete_user');
              if (error) throw error;
              
              await supabase.auth.signOut();
              router.replace('/');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Could not delete account. Please contact support.');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* NOTIFICATIONS SECTION */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>New Comments</Text>
              <Text style={styles.settingDescription}>When someone comments on your quote</Text>
            </View>
            <Switch 
              value={notifyComments} 
              onValueChange={(val) => toggleSwitch('notify_comments', val)}
              trackColor={{ false: '#e2e8f0', true: '#10b981' }}
              thumbColor={Platform.OS === 'ios' ? '#ffffff' : (notifyComments ? '#ffffff' : '#f8fafc')}
            />
          </View>
          <View style={styles.divider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Reactions & Likes</Text>
              <Text style={styles.settingDescription}>When someone reacts to your quote</Text>
            </View>
            <Switch 
              value={notifyReactions} 
              onValueChange={(val) => toggleSwitch('notify_reactions', val)}
              trackColor={{ false: '#e2e8f0', true: '#10b981' }}
              thumbColor={Platform.OS === 'ios' ? '#ffffff' : (notifyReactions ? '#ffffff' : '#f8fafc')}
            />
          </View>
          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>New Followers</Text>
              <Text style={styles.settingDescription}>When someone starts following you</Text>
            </View>
            <Switch 
              value={notifyFollowers}
              onValueChange={(val) => toggleSwitch('notify_followers', val)}
              trackColor={{ false: '#e2e8f0', true: '#10b981' }}
              thumbColor={Platform.OS === 'ios' ? '#ffffff' : (notifyFollowers ? '#ffffff' : '#f8fafc')}
            />
          </View>
        </View>

        {/* ACCOUNT ACTIONS SECTION */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={handleSignOut}>
            <LogOut size={20} color="#0f172a" />
            <Text style={styles.actionText}>Log out</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.actionRow} onPress={handleDeleteAccount}>
            <AlertTriangle size={20} color="#ef4444" />
            <Text style={[styles.actionText, styles.destructiveText]}>Delete account</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.versionText}>PinQuote v1.0.1</Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  iconButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  content: { padding: 24 },
  
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  card: { backgroundColor: '#ffffff', borderRadius: 20, paddingHorizontal: 16, marginBottom: 32, borderWidth: 1, borderColor: '#e2e8f0' },
  
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  settingTextContainer: { flex: 1, paddingRight: 16 },
  settingTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  settingDescription: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  
  divider: { height: 1, backgroundColor: '#f1f5f9' },
  
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, gap: 12 },
  actionText: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  destructiveText: { color: '#ef4444' },
  
  versionText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, fontWeight: '600', marginTop: 20 }
});