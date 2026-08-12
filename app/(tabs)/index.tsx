import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '../../services/supabase';
import QuoteCard from '../../components/QuoteCard';
import { FeedQuote, GroupedReaction } from '../../types/feed';

export default function FeedScreen() {
  const [quotes, setQuotes] = useState<FeedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Reusable function to format raw Supabase data into our UI state (just like your web code!)
  const formatQuote = (q: any, userId: string | null): FeedQuote => {
    const quoteReacts = (q.reactions || []).filter((r: any) => r.comment_id === null);
    const reactMap: Record<string, GroupedReaction> = {};
    
    quoteReacts.forEach((r: any) => {
      if (!reactMap[r.reaction_type]) {
        reactMap[r.reaction_type] = { emoji: r.reaction_type, count: 0, hasReacted: false };
      }
      reactMap[r.reaction_type].count++;
      if (userId && r.user_id === userId) reactMap[r.reaction_type].hasReacted = true;
    });

    return {
      ...q,
      groupedReactions: Object.values(reactMap).sort((a, b) => b.count - a.count),
      commentCount: q.comments?.[0]?.count || 0,
      favoriteCount: (q.favorites || []).length,
      isFavorited: userId ? (q.favorites || []).some((f: any) => f.user_id === userId) : false,
    };
  };

  const fetchQuotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('quotes')
        .select(`
          id, 
          content, 
          created_at, 
          custom_author_name,
          template_id,
          publisher:profiles!quotes_publisher_id_fkey(id, username),
          quoted_user:profiles!quotes_quoted_user_id_fkey(username, avatar_url),
          reactions(reaction_type, user_id, comment_id),
          favorites(user_id),
          comments(count)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      if (data) {
        const formattedQuotes = data.map(q => formatQuote(q, user?.id || null));
        setQuotes(formattedQuotes as unknown as FeedQuote[]);
      }
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

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchQuotes();
  }, []);

  const handleFavorite = async (quoteId: string) => {
    if (!currentUserId) return;
    
    // 1. Optimistic Update (Instant UI feedback)
    const isAdding = !quotes.find(q => q.id === quoteId)?.isFavorited;
    
    setQuotes(prev => prev.map(q => {
      if (q.id === quoteId) {
        return {
          ...q,
          isFavorited: isAdding,
          favoriteCount: q.favoriteCount + (isAdding ? 1 : -1)
        };
      }
      return q;
    }));

    // 2. Database Update
    if (isAdding) {
      await supabase.from('favorites').insert({ quote_id: quoteId, user_id: currentUserId });
    } else {
      await supabase.from('favorites').delete().match({ quote_id: quoteId, user_id: currentUserId });
    }
  };

  const handleReaction = async (emoji: string, quoteId: string) => {
    if (!currentUserId) return;

    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;
    
    const existingReaction = quote.groupedReactions.find(r => r.emoji === emoji);
    const isRemoving = existingReaction?.hasReacted || false;

    // 1. Optimistic Update
    setQuotes(prev => prev.map(q => {
      if (q.id !== quoteId) return q;
      
      let newReactions = [...q.groupedReactions];
      const existing = newReactions.find(r => r.emoji === emoji);
      
      if (isRemoving && existing) {
        existing.count--;
        existing.hasReacted = false;
        if (existing.count === 0) newReactions = newReactions.filter(r => r.emoji !== emoji);
      } else if (!isRemoving) {
        if (existing) { 
          existing.count++; 
          existing.hasReacted = true; 
        } else {
          newReactions.push({ emoji, count: 1, hasReacted: true });
        }
      }
      
      return { ...q, groupedReactions: newReactions.sort((a,b) => b.count - a.count) };
    }));

    // 2. Database Update
    if (isRemoving) {
      await supabase.from('reactions').delete().match({ quote_id: quoteId, user_id: currentUserId, reaction_type: emoji });
    } else {
      await supabase.from('reactions').insert({ quote_id: quoteId, user_id: currentUserId, reaction_type: emoji });
      
      // Send notification if reacting to someone else's post
      if (quote.publisher?.id && quote.publisher.id !== currentUserId) {
         await supabase.from('notifications').insert({
            receiver_id: quote.publisher.id,
            actor_id: currentUserId,
            type: 'reaction',
            quote_id: quoteId
         });
      }
    }
  };

  const handlePressComments = (quoteId: string) => {
    console.log('Navigate to comments for:', quoteId);
    // We will hook this up next!
  };

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
        renderItem={({ item }) => (
          <QuoteCard 
            quote={item} 
            onFavorite={handleFavorite}
            onReact={handleReaction}
            onPressComments={handlePressComments}
          />
        )}
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  listContent: { paddingTop: 60, paddingBottom: 100 },
});