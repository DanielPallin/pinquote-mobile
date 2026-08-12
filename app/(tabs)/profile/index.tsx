// app/(tabs)/profile/index.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  SafeAreaView, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, Bell, Edit3, Share, Crown, LayoutTemplate, Settings, Heart 
} from 'lucide-react-native';
import NotificationBell from '../../../components/NotificationBell';
import { supabase } from '../../../services/supabase';

interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  following: number;
  followers: number;
  favorites: number;
  isPro: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // 1. Get current authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        throw new Error('Not authenticated');
      }

      // 2. Fetch all profile data and counts concurrently for maximum performance
      const [
        { data: profile, error: profileError },
        { count: followersCount, error: followersError },
        { count: followingCount, error: followingError },
        { count: favoritesCount, error: favoritesError }
      ] = await Promise.all([
        supabase.from('profiles').select('id, username, avatar_url, bio').eq('id', authUser.id).single(),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', authUser.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', authUser.id),
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id)
      ]);

      if (profileError) throw profileError;

      // 3. Update the state with actual database counts
      if (profile) {
        setUser({
          id: profile.id,
          username: profile.username || 'Unknown',
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          following: followingCount || 0,
          followers: followersCount || 0,
          favorites: favoritesCount || 0,
          isPro: true // Mocked until subscriptions are implemented
        });
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Could not load profile data.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Could not load profile.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PinQuote</Text>
        <NotificationBell />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* USER INFO SECTION */}
        <View style={styles.userInfoSection}>
          <View style={styles.avatarColumn}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{user.username}</Text>
              <TouchableOpacity>
                <Edit3 size={16} color="#64748b" style={styles.editIcon} />
              </TouchableOpacity>
            </View>
            <View style={styles.avatarContainer}>
              {user.avatar_url ? (
                 <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                 <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {user.username.charAt(0).toUpperCase()}
                    </Text>
                 </View>
              )}
              <TouchableOpacity style={styles.shareBtn}>
                <Share size={16} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bioColumn}>
            <View style={styles.bioHeader}>
              <Text style={styles.bioLabel}>Bio</Text>
              <TouchableOpacity>
                <Edit3 size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.bioBox}>
              <Text style={styles.bioText}>
                {user.bio || 'This user has not set a bio yet. Click the edit button to add one!'}
              </Text>
            </View>
          </View>
        </View>

        {/* QUOTE GRIDS NAVIGATION */}
        <View style={styles.gridsSection}>
          <TouchableOpacity 
            style={styles.gridBtn}
            onPress={() => router.push('/profile/published')}
          >
            <Text style={styles.gridLabel}>Published Quotes</Text>
            <View style={styles.gridBox}>
               <View style={styles.gridRow}>
                 <View style={styles.gridCell} /><View style={styles.gridCell} />
               </View>
               <View style={styles.gridRow}>
                 <View style={styles.gridCell} /><View style={styles.gridCell} />
               </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridBtn}
            onPress={() => router.push('/profile/quoted-in')}
          >
            <Text style={styles.gridLabel}>Quoted In</Text>
            <View style={styles.gridBox}>
               <View style={styles.gridRow}>
                 <View style={styles.gridCell} /><View style={styles.gridCell} />
               </View>
               <View style={styles.gridRow}>
                 <View style={styles.gridCell} /><View style={styles.gridCell} />
               </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* BOTTOM SECTION: STATS & SETTINGS */}
        <View style={styles.bottomSection}>
          
          <View style={styles.statsColumn}>
            <TouchableOpacity style={styles.statPill}>
              <Text style={styles.statPillText}>Following</Text>
              <Text style={styles.statPillNumber}>{user.following}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statPill}>
              <Text style={styles.statPillText}>Followers</Text>
              <Text style={styles.statPillNumber}>{user.followers}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statPill}>
              <Text style={styles.statPillText}>Favourites</Text>
              <View style={styles.favoriteRow}>
                <Text style={styles.statPillNumber}>{user.favorites}</Text>
                {/* Changed from Star to Heart with a nice red color */}
                <Heart size={16} color="#ef4444" fill="#ef4444" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingsItem}>
              <Crown size={20} color="#eab308" />
              <Text style={styles.settingsText}>PinQuo Pro</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem}>
              <LayoutTemplate size={20} color="#94a3b8" />
              <Text style={styles.settingsText}>Templates</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingsItem}
              onPress={() => router.push('/profile/settings')}
            >
              <Settings size={20} color="#64748b" />
              <Text style={styles.settingsText}>Account settings</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  errorText: { fontSize: 16, color: '#ef4444', fontWeight: 'bold' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingBottom: 16,
    backgroundColor: '#f8fafc',
    zIndex: 10,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#0f172a' 
  },

  userInfoSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, gap: 16 },
  avatarColumn: { alignItems: 'center', flex: 1 },
  usernameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  username: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  editIcon: { marginLeft: 6 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#cbd5e1' },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholderText: { fontSize: 32, fontWeight: '800', color: '#64748b' },
  shareBtn: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#ffffff', padding: 8, borderRadius: 20, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  bioColumn: { flex: 1.2 },
  bioHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  bioLabel: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  bioBox: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 16, minHeight: 80 },
  bioText: { fontSize: 14, color: '#475569', lineHeight: 20, fontWeight: '500' },

  gridsSection: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 40 },
  gridBtn: { flex: 1, alignItems: 'center' },
  gridLabel: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  gridBox: { width: '100%', aspectRatio: 1, backgroundColor: '#f1f5f9', borderRadius: 24, padding: 8, borderWidth: 4, borderColor: '#bbf7d0' },
  gridRow: { flex: 1, flexDirection: 'row', gap: 8, marginBottom: 8 },
  gridCell: { flex: 1, backgroundColor: '#e2e8f0', borderRadius: 12 },

  bottomSection: { flexDirection: 'row', justifyContent: 'space-between', gap: 24 },
  statsColumn: { flex: 1, gap: 16 },
  statPill: { backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 24, alignItems: 'center' },
  statPillText: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 4 },
  statPillNumber: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
  favoriteRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  
  settingsList: { flex: 1.5, gap: 24, justifyContent: 'center' },
  settingsItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155' },
  chevron: { fontSize: 20, color: '#94a3b8', fontWeight: '500' }
});