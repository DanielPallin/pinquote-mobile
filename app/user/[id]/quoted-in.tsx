// app/user/[id]/quoted-in.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '../../../services/supabase';
import QuoteCard from '../../../components/QuoteCard';
import { FeedQuote } from '../../../types/feed';

export default function QuotedInScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [quotes, setQuotes] = useState<FeedQuote[]>([]);
  const [username, setUsername] = useState<string>('User');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchData(id as string);
    }
  }, [id]);

  const fetchData = async (targetId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', targetId)
        .single();
        
      if (profileData?.username) {
        setUsername(profileData.username);
      }

      // Fetch the quotes where this user was quoted
      const { data: quotesData, error } = await supabase
        .from('quotes')
        .select(`
          *,
          publisher:profiles!publisher_id(id, username, avatar_url),
          quoted_user:profiles!quoted_user_id(id, username, avatar_url)
        `)
        .eq('quoted_user_id', targetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setQuotes(quotesData as unknown as FeedQuote[]);
    } catch (error) {
      console.error('Error fetching quoted-in quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{username} was quoted in</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nobody has quoted {username} yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <QuoteCard quote={item} />
          )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  listContent: { paddingVertical: 24 },
  emptyContainer: { padding: 40, alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 15, color: '#94a3b8', fontWeight: '500', textAlign: 'center' },
});