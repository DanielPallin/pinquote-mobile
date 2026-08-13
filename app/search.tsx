// app/search.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, ArrowLeft } from 'lucide-react-native';
import { supabase } from '../services/supabase';

interface SearchUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  // Debounce search to avoid DB spam on every keystroke
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        setUsers([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const performSearch = async (query: string) => {
    setIsLoading(true);
    try {
      // Search for users
      const { data: searchData, error: searchError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', currentUserId)
        .limit(20);

      if (searchError) throw searchError;
      
      const fetchedUsers = searchData || [];
      setUsers(fetchedUsers);

      // Check follow status for these specific users
      if (fetchedUsers.length > 0 && currentUserId) {
        const userIds = fetchedUsers.map(u => u.id);
        
        const { data: followData, error: followError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId)
          .in('following_id', userIds);

        if (!followError && followData) {
          const newFollowingMap: Record<string, boolean> = {};
          followData.forEach(f => {
            newFollowingMap[f.following_id] = true;
          });
          setFollowingMap(newFollowingMap);
        }
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFollow = async (targetUserId: string) => {
    if (!currentUserId) return;
    
    const isCurrentlyFollowing = followingMap[targetUserId];
    
    // instantly update the UI for a snappier feel
    setFollowingMap(prev => ({ ...prev, [targetUserId]: !isCurrentlyFollowing }));

    try {
      if (isCurrentlyFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .match({ follower_id: currentUserId, following_id: targetUserId });
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: currentUserId, following_id: targetUserId });
          
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setFollowingMap(prev => ({ ...prev, [targetUserId]: isCurrentlyFollowing }));
    }
  };

  const navigateToUserProfile = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        
        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#0f172a" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searchQuery.length >= 2 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found for "{searchQuery}"</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Type at least 2 characters to search</Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            const isFollowing = followingMap[item.id];

            return (
              <TouchableOpacity 
                style={styles.userRow}
                onPress={() => navigateToUserProfile(item.id)}
              >
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {item.username?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                
                <Text style={styles.username}>{item.username}</Text>
                <TouchableOpacity 
                  style={[styles.followBtn, isFollowing && styles.followingBtn]}
                  onPress={() => toggleFollow(item.id)}
                >
                  <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  backBtn: { padding: 8, marginRight: 8, marginLeft: -8 },
  
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  
  listContent: { padding: 16 },
  userRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#cbd5e1' },
  avatarPlaceholder: { 
    width: 48, height: 48, borderRadius: 24, 
    backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' 
  },
  avatarPlaceholderText: { fontSize: 18, fontWeight: '800', color: '#64748b' },
  username: { flex: 1, marginLeft: 16, fontSize: 16, fontWeight: '700', color: '#0f172a' },

  followBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  followingBtnText: {
    color: '#0f172a',
  },
  
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#94a3b8', fontWeight: '500', textAlign: 'center' }
});