// app/(tabs)/profile/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  ScrollView, ActivityIndicator, Alert, Share as RNShare
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { 
  Edit3, Share, Crown, LayoutTemplate, Settings, Heart 
} from 'lucide-react-native';
import NotificationBell from '../../../components/NotificationBell';
import { supabase } from '../../../services/supabase';

interface StyleConfig {
  backgroundColor?: string;
  textColor?: string;
}

interface QuotePreview {
  id: string;
  content: string;
  live_photo_url: string | null;
  template: {
    style_config: StyleConfig;
  } | null;
}

interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  following: number;
  followers: number;
  favorites: number;
  isPro: boolean;
  latestPublished: QuotePreview[];
  latestQuotedIn: QuotePreview[];
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  const fetchUserProfile = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        throw new Error('Not authenticated');
      }

      const [
        { data: profile, error: profileError },
        { count: followersCount },
        { count: followingCount },
        { count: favoritesCount },
        { data: publishedQuotes },
        { data: quotedInQuotes }
      ] = await Promise.all([
        supabase.from('profiles').select('id, username, avatar_url, bio').eq('id', authUser.id).single(),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', authUser.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', authUser.id),
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id),
        supabase.from('quotes').select('id, content, live_photo_url, template:templates(style_config)').eq('publisher_id', authUser.id).order('created_at', { ascending: false }).limit(4),
        supabase.from('quotes').select('id, content, live_photo_url, template:templates(style_config)').eq('quoted_user_id', authUser.id).order('created_at', { ascending: false }).limit(4)
      ]);

      if (profileError) throw profileError;

      if (profile) {
        setUser({
          id: profile.id,
          username: profile.username || 'Unknown',
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          following: followingCount || 0,
          followers: followersCount || 0,
          favorites: favoritesCount || 0,
          isPro: true,
          latestPublished: (publishedQuotes as unknown as QuotePreview[]) || [],
          latestQuotedIn: (quotedInQuotes as unknown as QuotePreview[]) || []
        });
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Could not load profile data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareProfile = async () => {
    if (!user) return;
    try {
      await RNShare.share({
        message: `Check out my quotes on PinQuote! 📌\nFollow me: @${user.username}\n\nDownload the app to see my PinQuotes!`,
      });
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  const renderPreviewGrid = (quotes: QuotePreview[]) => {
    const emptySpots = 4 - quotes.length;
    return (
      <View style={styles.previewGrid}>
        {quotes.map(q => {
          const styleConfig = q.template?.style_config || {};
          const bgColor = styleConfig.backgroundColor || '#ffffff';
          const textColor = styleConfig.textColor || '#334155';
          const hasImage = !!q.live_photo_url;

          return (
            <View key={q.id} style={[styles.miniCard, { backgroundColor: hasImage ? '#000' : bgColor }]}>
              {hasImage && (
                <>
                  <Image source={{ uri: q.live_photo_url as string }} style={StyleSheet.absoluteFill} />
                  <View style={styles.imageOverlay} />
                </>
              )}
              <Text 
                style={[styles.miniCardText, { color: hasImage ? '#ffffff' : textColor }]} 
                numberOfLines={2}
              >
                {`“${q.content}”`}
              </Text>
            </View>
          );
        })}
        {Array.from({ length: emptySpots }).map((_, i) => (
          <View key={`empty-${i}`} style={[styles.miniCard, styles.emptyMiniCard]} />
        ))}
      </View>
    );
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PinQuote</Text>
        <NotificationBell />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.userInfoSection}>
          <View style={styles.avatarColumn}>
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
            </View>
            <Text style={styles.username}>{user.username}</Text>
          </View>

          <View style={styles.bioColumn}>
            <Text style={styles.bioLabel}>Bio</Text>
            <View style={styles.bioBox}>
              <Text style={styles.bioText}>
                {user.bio || 'This user has not set a bio yet.'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/profile/edit')}>
            <Edit3 size={16} color="#0f172a" />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleShareProfile}>
            <Share size={16} color="#0f172a" />
            <Text style={styles.actionButtonText}>Share Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridsSection}>
          <TouchableOpacity style={styles.gridBtn} onPress={() => router.push('/profile/published')}>
            <Text style={styles.gridLabel}>Published Quotes</Text>
            <View style={styles.gridBoxWrapper}>
               {renderPreviewGrid(user.latestPublished)}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridBtn} onPress={() => router.push('/profile/quoted-in')}>
            <Text style={styles.gridLabel}>Quoted In</Text>
            <View style={styles.gridBoxWrapper}>
               {renderPreviewGrid(user.latestQuotedIn)}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.statsColumn}>
            <TouchableOpacity style={styles.statPill} onPress={() => router.push('/profile/network?tab=following')}>
              <Text style={styles.statPillText}>Following</Text>
              <Text style={styles.statPillNumber}>{user.following}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statPill} onPress={() => router.push('/profile/network?tab=followers')}>
              <Text style={styles.statPillText}>Followers</Text>
              <Text style={styles.statPillNumber}>{user.followers}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statPill} onPress={() => router.push('/profile/favorites')}>
              <Text style={styles.statPillText}>Favourites</Text>
              <View style={styles.favoriteRow}>
                <Text style={styles.statPillNumber}>{user.favorites}</Text>
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

            <TouchableOpacity style={styles.settingsItem} onPress={() => router.push('/profile/settings')}>
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
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, backgroundColor: '#f8fafc', zIndex: 10 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a' },

  userInfoSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 16 },
  avatarColumn: { alignItems: 'center', flex: 1, gap: 8 },
  username: { fontSize: 16, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#cbd5e1', overflow: 'hidden' },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholderText: { fontSize: 32, fontWeight: '800', color: '#64748b' },
  
  bioColumn: { flex: 1.2 },
  bioLabel: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  bioBox: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 16, minHeight: 80 },
  bioText: { fontSize: 14, color: '#475569', lineHeight: 20, fontWeight: '500' },

  actionButtonsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0', paddingVertical: 14, borderRadius: 16, gap: 8 },
  actionButtonText: { fontSize: 15, fontWeight: '700', color: '#0f172a' },

  gridsSection: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 40 },
  gridBtn: { flex: 1, alignItems: 'center' },
  gridLabel: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  
  gridBoxWrapper: { width: '100%', aspectRatio: 1, backgroundColor: '#f1f5f9', borderRadius: 24, padding: 8, borderWidth: 4, borderColor: '#bbf7d0' },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, width: '100%', height: '100%', justifyContent: 'space-between', alignContent: 'space-between' },
  
  miniCard: { width: '47%', height: '47%', borderRadius: 12, padding: 4, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, overflow: 'hidden', position: 'relative' },
  emptyMiniCard: { backgroundColor: '#e2e8f0', borderWidth: 0, shadowOpacity: 0, elevation: 0 },
  miniCardText: { fontSize: 8, textAlign: 'center', fontWeight: '800', lineHeight: 11, zIndex: 2 },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1 },

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