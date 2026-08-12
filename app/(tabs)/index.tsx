import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '../../services/supabase';
import QuoteCard, { FeedQuote } from '../../components/QuoteCard';

export default function FeedScreen() {
  const [quotes, setQuotes] = useState<FeedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQuotes = async () => {
    try {
      // Using exactly the same relational query structure as your web app
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          id, 
          content, 
          created_at, 
          custom_author_name,
          template_id,
          publisher:profiles!quotes_publisher_id_fkey(username),
          quoted_user:profiles!quotes_quoted_user_id_fkey(username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(10); // Start with 10 for MVP

      if (error) throw error;
      if (data) setQuotes(data as unknown as FeedQuote[]);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchQuotes();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <QuoteCard quote={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#0f172a" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingTop: 60, // Safe space from top
    paddingBottom: 100, // Safe space for bottom tab bar
  },
});