import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Send, X } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import QuoteCard from '../../components/QuoteCard';
import { FeedQuote, GroupedReaction } from '../../types/feed';
import NotificationBell from '../../components/NotificationBell';

type CommentType = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
};

export default function FeedScreen() {
  const [quotes, setQuotes] = useState<FeedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Comments Sheet State
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = ['60%', '90%'];

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
          live_photo_url,
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

  useFocusEffect(
    useCallback(() => {
      fetchQuotes();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchQuotes();
  }, []);

  const handlePressComments = async (quoteId: string) => {
    setActiveQuoteId(quoteId);
    bottomSheetRef.current?.expand();
    setIsLoadingComments(true);

    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (username, avatar_url)
        `)
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setComments(data as unknown as CommentType[]);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSendComment = async () => {
    if (!newCommentText.trim() || !activeQuoteId || !currentUserId) return;

    const textToSend = newCommentText.trim();
    setNewCommentText('');

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          quote_id: activeQuoteId,
          user_id: currentUserId,
          content: textToSend,
        })
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (username, avatar_url)
        `)
        .single();

      if (error) throw error;

      if (data) {
        setComments(prev => [...prev, data as unknown as CommentType]);

        setQuotes(prev => prev.map(q => {
          if (q.id === activeQuoteId) {
            return { ...q, commentCount: q.commentCount + 1 };
          }
          return q;
        }));

        const targetQuote = quotes.find(q => q.id === activeQuoteId);
        
        if (targetQuote?.publisher?.id && targetQuote.publisher.id !== currentUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('notify_comments')
            .eq('id', targetQuote.publisher.id)
            .single();
            
          if (profile?.notify_comments) {
            await supabase.from('notifications').insert({
              receiver_id: targetQuote.publisher.id,
              actor_id: currentUserId,
              type: 'comment',
              quote_id: activeQuoteId
            });
          }
        }
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleFavorite = async (quoteId: string) => {
    if (!currentUserId) return;
    const isAdding = !quotes.find(q => q.id === quoteId)?.isFavorited;
    
    setQuotes(prev => prev.map(q => {
      if (q.id === quoteId) {
        return { ...q, isFavorited: isAdding, favoriteCount: q.favoriteCount + (isAdding ? 1 : -1) };
      }
      return q;
    }));

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

    setQuotes(prev => prev.map(q => {
      if (q.id !== quoteId) return q;
      let newReactions = [...q.groupedReactions];
      const existing = newReactions.find(r => r.emoji === emoji);
      
      if (isRemoving && existing) {
        existing.count--;
        existing.hasReacted = false;
        if (existing.count === 0) newReactions = newReactions.filter(r => r.emoji !== emoji);
      } else if (!isRemoving) {
        if (existing) { existing.count++; existing.hasReacted = true; } 
        else { newReactions.push({ emoji, count: 1, hasReacted: true }); }
      }
      return { ...q, groupedReactions: newReactions.sort((a,b) => b.count - a.count) };
    }));

    if (isRemoving) {
      await supabase.from('reactions').delete().match({ quote_id: quoteId, user_id: currentUserId, reaction_type: emoji });
    } else {
      await supabase.from('reactions').insert({ quote_id: quoteId, user_id: currentUserId, reaction_type: emoji });
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

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with App Title and Notification Bell */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PinQuote</Text>
        <NotificationBell />
      </View>

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

      {/* Comments Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Comments</Text>
            <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
              <X size={22} color="#0f172a" />
            </TouchableOpacity>
          </View>

          {isLoadingComments ? (
            <View style={styles.center}>
              <ActivityIndicator color="#0f172a" />
            </View>
          ) : (
            <BottomSheetFlatList
              data={comments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentsList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.avatarText}>
                      {item.profiles?.username?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentUser}>{item.profiles?.username || 'Anonym'}</Text>
                    <Text style={styles.commentText}>{item.content}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
              }
            />
          )}

          {/* Input Box */}
          <View style={styles.inputContainer}>
            <BottomSheetTextInput
              style={styles.input}
              placeholder="Write a comment..."
              placeholderTextColor="#94a3b8"
              value={newCommentText}
              onChangeText={setNewCommentText}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !newCommentText.trim() && { opacity: 0.5 }]} 
              onPress={handleSendComment}
              disabled={!newCommentText.trim()}
            >
              <Send size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // New Header Styles
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 60, // Safe area space
    paddingBottom: 16,
    backgroundColor: '#f8fafc',
    zIndex: 10,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#0f172a' 
  },
  
  listContent: { paddingTop: 10, paddingBottom: 100 }, // Reduced paddingTop since header takes space
  
  sheetContainer: { flex: 1, backgroundColor: '#ffffff' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  commentsList: { padding: 20, paddingBottom: 40 },
  commentRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontWeight: '700', color: '#475569', fontSize: 14 },
  commentBubble: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  commentUser: { fontWeight: '700', fontSize: 13, color: '#0f172a', marginBottom: 2 },
  commentText: { fontSize: 14, color: '#334155' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#ffffff' },
  input: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 24, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15, color: '#0f172a' },
  sendButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});