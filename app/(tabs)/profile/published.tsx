// app/(tabs)/profile/published.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, StyleSheet, FlatList, ActivityIndicator, Text, TouchableOpacity, Alert 
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { supabase } from '../../../services/supabase';
import QuoteCard from '../../../components/QuoteCard';
import { FeedQuote } from '../../../types/feed';
import NotificationBell from '../../../components/NotificationBell';

const ITEMS_PER_PAGE = 5;

export default function PublishedQuotesScreen() {
  const [quotes, setQuotes] = useState<FeedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchPublishedFeed(0);
  }, []);

  const fetchPublishedFeed = async (pageNumber: number) => {
    try {
      if (pageNumber === 0) setIsLoading(true);
      else setIsPaginationLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      if (pageNumber === 0) setCurrentUserId(user.id);

      const start = pageNumber * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('quotes')
        .select(`
          id, content, created_at, quoted_email, custom_author_name, live_photo_url,
          publisher:profiles!quotes_publisher_id_fkey(id, username),
          quoted_user:profiles!quotes_quoted_user_id_fkey(username, avatar_url),
          template:templates(style_config),
          reactions(reaction_type, user_id, comment_id),
          favorites(user_id),
          comments(count)
        `)
        .eq('publisher_id', user.id)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      const formattedData = data as unknown as FeedQuote[]; 

      if (formattedData.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

      setQuotes(prev => pageNumber === 0 ? formattedData : [...prev, ...formattedData]);

    } catch (error) {
      console.error("Error fetching published feed:", error);
    } finally {
      setIsLoading(false);
      setIsPaginationLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!isPaginationLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPublishedFeed(nextPage);
    }
  };

  const handleDeleteQuote = (quoteId: string) => {
    Alert.alert(
      "Delete Quote",
      "Are you sure you want to delete this quote? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              // 1. Find the quote to see if it has an image
              const quoteToDelete = quotes.find(q => q.id === quoteId);
              
              // Optimistic UI update
              setQuotes(prev => prev.filter(q => q.id !== quoteId));
              
              // 2. If there is an image, delete it from the storage bucket
              if (quoteToDelete?.live_photo_url) {
                // Extract the file path from the public URL. 
                // Assuming URL structure ends with /quotes_media/userId/filename.jpg
                const urlParts = quoteToDelete.live_photo_url.split('/');
                const fileName = urlParts.pop();
                const folderName = urlParts.pop(); // This should be the userId
                const filePath = `${folderName}/${fileName}`;

                // Make sure to use your actual bucket name here (e.g., 'quotes_media')
                await supabase.storage.from('quotes_media').remove([filePath]);
              }

              // 3. Delete from database
              const { error } = await supabase
                .from('quotes')
                .delete()
                .eq('id', quoteId);

              if (error) throw error;
            } catch (error) {
              console.error("Error deleting quote:", error);
              Alert.alert("Error", "Could not delete the quote.");
              fetchPublishedFeed(0); // Revert optimistic UI on failure
            }
          } 
        }
      ]
    );
  };

  const handleReaction = (emoji: string, quoteId: string) => {};
  const handleFavorite = (quoteId: string) => {};

  if (isLoading && page === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Published</Text>
        <NotificationBell />
      </View>

      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.quoteWrapper}>
            <QuoteCard 
              quote={item}
              onReact={handleReaction}
              onFavorite={handleFavorite}
              onOpenProfile={() => {}}
            />
            {/* DELETE BUTTON OVERLAY */}
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteQuote(item.id)}
            >
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You dont have any published quotes yet.</Text>
          </View>
        }
        ListFooterComponent={
          isPaginationLoading ? (
            <ActivityIndicator size="small" color="#94a3b8" style={styles.footerLoader} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#f8fafc',
    zIndex: 10,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  
  // WRAPPER TO POSITION DELETE BUTTON
  quoteWrapper: { position: 'relative', marginBottom: 16 },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 20,
    zIndex: 10, // Ensure it's above the QuoteCard
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },

  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#94a3b8', textAlign: 'center' },
  footerLoader: { marginVertical: 20 }
});