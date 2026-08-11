// app/(tabs)/profile/published.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  Text 
} from 'react-native';
import { supabase } from '../../../services/supabase';
import { QuoteCard } from '../../../components/QuoteCard';
import { FeedQuote } from '../../../types/feed';

const ITEMS_PER_PAGE = 5;

export default function PublishedQuotesScreen() {
  const [quotes, setQuotes] = useState<FeedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
          id, content, created_at, quoted_email, custom_author_name,
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

      // NOTE: Parse data through your formatQuote function here
      const formattedData = data as unknown as FeedQuote[]; // Placeholder cast

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

  useEffect(() => {
    fetchPublishedFeed(0);
  }, []);

  const handleLoadMore = () => {
    if (!isPaginationLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPublishedFeed(nextPage);
    }
  };

  // Optimistic UI updates for the list
  const handleReaction = (emoji: string, quoteId: string) => {
    console.log(`Reacted with ${emoji} on ${quoteId}`);
  };

  const handleFavorite = (quoteId: string) => {
    setQuotes(prev => prev.map(q => {
      if (q.id === quoteId) {
        const isAdding = !q.isFavorited;
        return {
          ...q,
          isFavorited: isAdding,
          favoriteCount: q.favoriteCount + (isAdding ? 1 : -1)
        };
      }
      return q;
    }));
  };

  if (isLoading && page === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <QuoteCard 
            quote={item}
            onReact={handleReaction}
            onFavorite={handleFavorite}
            onOpenProfile={(username) => console.log('Already in profile context')}
          />
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
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
  },
  footerLoader: {
    marginVertical: 20,
  }
});