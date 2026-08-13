// src/hooks/useFeed.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { FeedQuote } from '../types/feed';

const ITEMS_PER_PAGE = 5;

export function useFeed(currentUserId: string | null) {
  const [quotes, setQuotes] = useState<FeedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(async (pageNumber: number) => {
    try {
      if (pageNumber === 0) setIsLoading(true);
      else setIsFetchingNextPage(true);

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
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      const formattedData = data as unknown as FeedQuote[]; // Placeholder

      if (formattedData.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

      setQuotes(prev => pageNumber === 0 ? formattedData : [...prev, ...formattedData]);
      
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setIsLoading(false);
      setIsFetchingNextPage(false);
    }
  }, [currentUserId]);

  // Initial fetch
  useEffect(() => {
    fetchPage(0);
  }, [fetchPage]);

  // Infinite scroll trigger
  const loadMore = () => {
    if (!isFetchingNextPage && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPage(nextPage);
    }
  };

  // Optimistic UI updates
  const toggleFavoriteOptimistic = (quoteId: string) => {
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

  return {
    quotes,
    isLoading,
    isFetchingNextPage,
    loadMore,
    toggleFavoriteOptimistic
  };
}