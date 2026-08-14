// app/user/[id].tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  ScrollView, ActivityIndicator, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Crown, User } from 'lucide-react-native';
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

interface PublicProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  is_pro: boolean;
}

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const [publishedQuotes, setPublishedQuotes] = useState<QuotePreview[]>([]);
  const [quotedInQuotes, setQuotedInQuotes] = useState<QuotePreview[]>([]);

  useEffect(() => {
    if (id) fetchPublicProfile(id as string);
  }, [id]);

  const fetchPublicProfile = async (targetUserId: string) => {
    try {
      // Get current logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser({ id: user.id });

      // Fetch target profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, is_pro')
        .eq('id', targetUserId)
        .single();

      if (profileError || !profileData) {
        setIsNotFound(true);
        return;
      }
      setProfile(profileData);

      // Fetch Stats & Follow Status & Quotes in parallel
      const [
        { count: followerCount },
        { count: followingCount },
        { data: followData },
        { data: pubQuotes },
        { data: quotedQuotes }
      ] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId),
        user ? supabase.from('follows').select('created_at').match({ follower_id: user.id, following_id: targetUserId }).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from('quotes').select('id, content, live_photo_url, template:templates(style_config)').eq('publisher_id', targetUserId).order('created_at', { ascending: false }).limit(4),
        supabase.from('quotes').select('id, content, live_photo_url, template:templates(style_config)').eq('quoted_user_id', targetUserId).order('created_at', { ascending: false }).limit(4)
      ]);

      setFollowers(followerCount || 0);
      setFollowing(followingCount || 0);
      if (followData) setIsFollowing(true);
      
      setPublishedQuotes((pubQuotes as unknown as QuotePreview[]) || []);
      setQuotedInQuotes((quotedQuotes as unknown as QuotePreview[]) || []);

    } catch (error) {
      console.error('Error fetching public profile:', error);
      setIsNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser || !profile || isTogglingFollow) return;
    
    setIsTogglingFollow(true);
    const currentlyFollowing = isFollowing;

    setIsFollowing(!currentlyFollowing);
    setFollowers(prev => prev + (currentlyFollowing ? -1 : 1));

    try {
      if (!currentlyFollowing) {
        // Follow action
        const { error: followErr } = await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: profile.id });
        
        if (followErr) throw followErr;

        // Trigger Notification
        const { error: notifErr } = await supabase.from('notifications').insert({
          receiver_id: profile.id,
          actor_id: currentUser.id,
          type: 'follow'
        });

        if (notifErr) console.error("Notification failed to send:", notifErr);

      } else {
        // Unfollow action
        const { error } = await supabase
          .from('follows')
          .delete()
          .match({ follower_id: currentUser.id, following_id: profile.id });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      // Revert if error
      setIsFollowing(currentlyFollowing);
      setFollowers(prev => prev + (currentlyFollowing ? 1 : -1));
      Alert.alert('Error', 'Could not update follow status.');
    } finally {
      setIsTogglingFollow(false);
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
                "{q.content}"
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

  if (isNotFound || !profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
          <Text style={styles.backButtonLargeText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={28} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {profile.is_pro && (
              <Crown size={24} color="#eab308" fill="#fef08a" style={styles.crownIcon} />
            )}
            
            <View style={styles.avatarBorder}>
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={40} color="#94a3b8" />
                </View>
              )}
            </View>
          </View>
          
          <Text style={styles.username}>{profile.username}</Text>
          {profile.bio && <Text style={styles.bioText}>{profile.bio}</Text>}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* Follow Button */}
          <TouchableOpacity 
            style={[
              styles.followButton, 
              isOwnProfile ? styles.ownProfileBtn : (isFollowing ? styles.followingBtn : styles.primaryFollowBtn)
            ]}
            onPress={handleToggleFollow}
            disabled={isOwnProfile || isTogglingFollow}
          >
            <Text style={[
              styles.followButtonText,
              isOwnProfile ? styles.ownProfileText : (isFollowing ? styles.followingText : styles.primaryFollowText)
            ]}>
              {isOwnProfile ? 'This is you' : (isFollowing ? 'Following' : 'Follow')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Grids */}
        <View style={styles.gridsSection}>
          <TouchableOpacity 
            style={styles.gridBtn}
            onPress={() => router.push(`/user/${profile.id}/published`)}
          >
            <Text style={styles.gridLabel}>Published Quotes</Text>
            <View style={styles.gridBoxWrapper}>
               {renderPreviewGrid(publishedQuotes)}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridBtn}
            onPress={() => router.push(`/user/${profile.id}/quoted-in`)}
          >
            <Text style={styles.gridLabel}>Quoted In</Text>
            <View style={styles.gridBoxWrapper}>
               {renderPreviewGrid(quotedInQuotes)}
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', padding: 24 },
  errorText: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 24 },
  backButtonLarge: { backgroundColor: '#0f172a', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 32 },
  backButtonLargeText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  iconButton: { padding: 8, marginLeft: -8 },
  
  scrollContent: { paddingBottom: 40 },
  
  profileSection: { 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    marginTop: 32,
    marginBottom: 40 
  },
  avatarContainer: { alignItems: 'center', marginBottom: 16, position: 'relative' },
  crownIcon: { position: 'absolute', top: -20, zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2 },
  avatarBorder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#f1f5f9', borderWidth: 4, borderColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  
  username: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  bioText: { fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 24, paddingHorizontal: 16 },
  
  statsRow: { flexDirection: 'row', gap: 48, marginBottom: 32 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  statLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  
  followButton: { width: '100%', maxWidth: 280, paddingVertical: 16, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  primaryFollowBtn: { backgroundColor: '#0f172a' },
  followingBtn: { backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#e2e8f0', elevation: 0, shadowOpacity: 0 },
  ownProfileBtn: { backgroundColor: '#f1f5f9', elevation: 0, shadowOpacity: 0 },
  
  followButtonText: { fontSize: 16, fontWeight: '900' },
  primaryFollowText: { color: '#ffffff' },
  followingText: { color: '#475569' },
  ownProfileText: { color: '#94a3b8' },

  gridsSection: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingHorizontal: 24 },
  gridBtn: { flex: 1, alignItems: 'center' },
  gridLabel: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  gridBoxWrapper: { width: '100%', aspectRatio: 1, backgroundColor: '#f1f5f9', borderRadius: 24, padding: 8, borderWidth: 4, borderColor: '#f8fafc' },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, width: '100%', height: '100%', justifyContent: 'space-between', alignContent: 'space-between' },
  
  miniCard: { width: '47%', height: '47%', borderRadius: 12, padding: 4, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, overflow: 'hidden', position: 'relative' },
  emptyMiniCard: { backgroundColor: '#e2e8f0', borderWidth: 0, shadowOpacity: 0, elevation: 0 },
  miniCardText: { fontSize: 8, textAlign: 'center', fontWeight: '800', lineHeight: 11, zIndex: 2 },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1 },
});