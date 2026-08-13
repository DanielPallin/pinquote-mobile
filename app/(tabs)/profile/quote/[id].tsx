import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../../services/supabase';
import QuoteCard from '../../../../components/QuoteCard';
import { FeedQuote, GroupedReaction } from '../../../../types/feed';

export default function SingleQuoteScreen() {
  const { id } = useLocalSearchParams();
  const [quote, setQuote] = useState<FeedQuote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSingleQuote(id as string);
    }
  }, [id]);

  const fetchSingleQuote = async (quoteId: string) => {
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
          live_photo_url,
          publisher:profiles!quotes_publisher_id_fkey(id, username),
          quoted_user:profiles!quotes_quoted_user_id_fkey(username, avatar_url),
          reactions(reaction_type, user_id, comment_id),
          favorites(user_id),
          comments(count)
        `)
        .eq('id', quoteId)
        .single();

      if (error) throw error;

      if (data) {
        // Format quote exactly like in the feed
        const quoteReacts = (data.reactions || []).filter((r: any) => r.comment_id === null);
        const reactMap: Record<string, GroupedReaction> = {};
        
        quoteReacts.forEach((r: any) => {
          if (!reactMap[r.reaction_type]) {
            reactMap[r.reaction_type] = { emoji: r.reaction_type, count: 0, hasReacted: false };
          }
          reactMap[r.reaction_type].count++;
          if (user?.id && r.user_id === user.id) reactMap[r.reaction_type].hasReacted = true;
        });

        const formattedQuote: FeedQuote = {
          ...data,
          groupedReactions: Object.values(reactMap).sort((a, b) => b.count - a.count),
          commentCount: data.comments?.[0]?.count || 0,
          favoriteCount: (data.favorites || []).length,
          isFavorited: user?.id ? (data.favorites || []).some((f: any) => f.user_id === user.id) : false,
        };

        setQuote(formattedQuote);
      }
    } catch (error) {
      console.error('Error fetching single quote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic handlers to prevent crashes when interacting in the single view
  const handleFavorite = (quoteId: string) => {
    console.log('Toggle favorite on single quote', quoteId);
  };

  const handleReaction = (emoji: string, quoteId: string) => {
    console.log('Toggle reaction on single quote', emoji, quoteId);
  };

  if (isLoading || !quote) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <QuoteCard 
        quote={quote}
        onFavorite={handleFavorite}
        onReact={handleReaction}
        onPressComments={() => console.log('Open comments sheet')}
      />
    </ScrollView>
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
  content: {
    paddingVertical: 24,
  }
});