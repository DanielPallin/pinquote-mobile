// app/(tabs)/profile/network.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Image 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../services/supabase';

type TabType = 'following' | 'followers';

interface NetworkUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

export default function NetworkScreen() {
  const { tab } = useLocalSearchParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<TabType>(
    tab === 'followers' ? 'followers' : 'following'
  );
  const [users, setUsers] = useState<NetworkUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchNetworkData();
  }, [activeTab]);

  const fetchNetworkData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      if (activeTab === 'following') {
        // Get users that the current user is following
        const { data, error } = await supabase
          .from('follows')
          .select(`
            following_id,
            profiles!follows_following_id_fkey(id, username, avatar_url)
          `)
          .eq('follower_id', user.id);

        if (error) throw error;
        
        const formatted = data.map((item: any) => item.profiles) as NetworkUser[];
        setUsers(formatted);

      } else {
        const { data, error } = await supabase
          .from('follows')
          .select(`
            follower_id,
            profiles!follows_follower_id_fkey(id, username, avatar_url)
          `)
          .eq('following_id', user.id);

        if (error) throw error;

        const formatted = data.map((item: any) => item.profiles) as NetworkUser[];
        setUsers(formatted);
      }
    } catch (error) {
      console.error('Error fetching network:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Following
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
            Followers
          </Text>
        </TouchableOpacity>
      </View>

      {/* User List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color="#0f172a" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'following' 
                  ? "You aren't following anyone yet." 
                  : "You don't have any followers yet."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.userRow}
              onPress={() => console.log('Navigate to user profile:', item.id)}
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
              
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>
                  {activeTab === 'following' ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabContainer: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff'
  },
  tab: { 
    flex: 1, 
    paddingVertical: 16, 
    alignItems: 'center' 
  },
  activeTab: { 
    borderBottomWidth: 2, 
    borderBottomColor: '#0f172a' 
  },
  tabText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#64748b' 
  },
  activeTabText: { 
    color: '#0f172a', 
    fontWeight: '800' 
  },
  listContent: { padding: 24 },
  userRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  avatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#cbd5e1' 
  },
  avatarPlaceholder: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#e2e8f0', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarPlaceholderText: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#64748b' 
  },
  username: { 
    flex: 1, 
    marginLeft: 12, 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#0f172a' 
  },
  followButton: { 
    backgroundColor: '#f1f5f9', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 16 
  },
  followButtonText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#0f172a' 
  },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#94a3b8', fontWeight: '500', textAlign: 'center' }
});