import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Alert } from 'react-native';
import { Heart, MessageCircle, SmilePlus, MoreHorizontal, Flag } from 'lucide-react-native';
import { TEMPLATES } from '../constants/templates';
import { FeedQuote } from '../types/feed';
import { supabase } from '../services/supabase'; // Ensure path is correct

type Props = {
  quote: FeedQuote;
  onReact?: (emoji: string, quoteId: string) => void;
  onFavorite?: (quoteId: string) => void;
  onOpenProfile?: (username: string) => void;
  onPressComments?: (quoteId: string) => void;
};

const QUICK_EMOJIS = ['😂', '🔥', '❤️', '💀', '💯', '🙏', '👀', '✨', '😢', '😍'];

export default function QuoteCard({ quote, onReact, onFavorite, onOpenProfile, onPressComments }: Props) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const template = TEMPLATES.find(t => t.id === quote.template_id) || TEMPLATES[0];
  
  const authorName = quote.quoted_user?.username || quote.custom_author_name || 'Unknown';
  const publisherName = quote.publisher?.username || 'Someone';

  const isPhoto = !!quote.live_photo_url;
  const bgColor = isPhoto ? '#000000' : template.backgroundColor;
  const textColor = isPhoto ? '#ffffff' : template.textColor;

  const handleReactionPress = (emoji: string) => {
    onReact?.(emoji, quote.id);
    setShowEmojiPicker(false);
  };

  const CardContent = () => (
    <>
      {isPhoto && <View style={styles.overlay} />}
      <Text style={[styles.quoteMark, { color: textColor }]}>“ ”</Text>
      <Text style={[styles.content, { color: textColor }, isPhoto && styles.photoTextShadow]}>
        {quote.content}
      </Text>
      
      <View style={styles.authorContainer}>
        <View style={[styles.divider, { backgroundColor: textColor }]} />
        <Text style={[styles.authorText, { color: textColor }, isPhoto && styles.photoTextShadow]}>
          -{authorName}
        </Text>
      </View>
    </>
  );

  const handleOptions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'You must be logged in to do this.');
      return;
    }

    // IF IT IS YOUR OWN QUOTE:
    if (user.id === quote.publisher?.id) {
      Alert.alert(
        'Your Quote',
        'You cannot report or block yourself.',
        [{ text: 'OK', style: 'cancel' }]
      );
      return; 
    }

    // IF IT IS SOMEONE ELSE'S QUOTE:
    Alert.alert(
      'Options',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report Quote',
          style: 'destructive',
          onPress: () => handleReportQuote(user.id),
        },
        {
          text: 'Block User',
          style: 'destructive',
          onPress: () => handleBlockUser(user.id),
        },
      ]
    );
  };

  const handleReportQuote = (currentUserId: string) => {
    // Using standard Alert instead of prompt for Android compatibility
    Alert.alert(
      'Report Quote',
      'Why are you reporting this quote?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Spam',
          onPress: () => submitReport(currentUserId, 'Spam'),
        },
        {
          text: 'Inappropriate Content',
          style: 'destructive',
          onPress: () => submitReport(currentUserId, 'Inappropriate Content'),
        },
      ]
    );
  };

  const submitReport = async (currentUserId: string, reason: string) => {
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: currentUserId,
        quote_id: quote.id,
        reported_user_id: quote.publisher?.id,
        reason: reason,
      });
      if (error) throw error;
      Alert.alert('Thank you', 'The quote has been reported and will be reviewed.');
    } catch (error) {
      console.error('Error reporting:', error);
      Alert.alert('Error', 'Could not submit report.');
    }
  };

  const handleBlockUser = (currentUserId: string) => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${publisherName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('blocks').insert({
                blocker_id: currentUserId,
                blocked_id: quote.publisher?.id,
              });
              if (error) throw error;
              Alert.alert('Blocked', 'User has been blocked. Refresh the feed to apply changes.');
            } catch (error) {
              console.error('Error blocking:', error);
              Alert.alert('Error', 'Could not block user.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      
      {/* --- NEW HEADER ROW --- */}
      <View style={styles.headerRow}>
        <Text style={[styles.contextText, { flex: 1 }]}>
          <Text style={styles.boldText} onPress={() => onOpenProfile?.(authorName)}>{authorName}</Text> has been quoted by <Text style={styles.boldText} onPress={() => publisherName !== 'Someone' && onOpenProfile?.(publisherName)}>{publisherName}</Text>
        </Text>
        
        {/* THREE DOTS BUTTON */}
        <TouchableOpacity 
          onPress={handleOptions} 
          style={styles.optionsButton} 
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Flag size={20} color="#fa0000" />
        </TouchableOpacity>
      </View>
      {/* --------------------- */}

      {isPhoto ? (
        <ImageBackground 
          source={{ uri: quote.live_photo_url as string }} 
          style={[styles.card, { overflow: 'hidden' }]}
        >
          <CardContent />
        </ImageBackground>
      ) : (
        <View style={[styles.card, { backgroundColor: bgColor }]}>
          <CardContent />
        </View>
      )}

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onFavorite?.(quote.id)}>
            <Heart 
              size={24} 
              color={quote.isFavorited ? '#ef4444' : '#64748b'} 
              fill={quote.isFavorited ? '#ef4444' : 'transparent'} 
            />
            <Text style={[styles.actionText, quote.isFavorited && { color: '#ef4444' }]}>
              {quote.favoriteCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => onPressComments?.(quote.id)}>
            <MessageCircle size={24} color="#64748b" />
            <Text style={styles.actionText}>{quote.commentCount}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rightActions}>
          {quote.groupedReactions?.map((r) => (
            <TouchableOpacity 
              key={r.emoji} 
              onPress={() => onReact?.(r.emoji, quote.id)}
              style={[styles.reactionBadge, r.hasReacted && styles.reactionBadgeActive]}
            >
              <Text style={styles.reactionEmoji}>{r.emoji}</Text>
              <Text style={[styles.reactionCount, r.hasReacted && styles.reactionCountActive]}>
                {r.count}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.addReactionContainer}>
            <TouchableOpacity 
              style={styles.addReactionButton} 
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <SmilePlus size={20} color="#64748b" />
            </TouchableOpacity>

            {showEmojiPicker && (
              <View style={styles.emojiPopover}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.emojiScrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {QUICK_EMOJIS.map(emoji => (
                    <TouchableOpacity 
                      key={emoji} 
                      onPress={() => handleReactionPress(emoji)}
                      style={styles.emojiButton}
                    >
                      <Text style={styles.quickEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 32, paddingHorizontal: 16 },
  contextText: { textAlign: 'left', color: '#64748b', fontSize: 14 },
  boldText: { fontWeight: '700', color: '#0f172a' },
  card: { borderRadius: 32, padding: 32, alignItems: 'center', shadowColor: '#000000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 8 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  quoteMark: { fontSize: 64, fontWeight: '900', lineHeight: 64, marginBottom: -10, opacity: 0.3 },
  content: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 24 },
  photoTextShadow: { textShadowColor: 'rgba(0, 0, 0, 0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  authorContainer: { alignItems: 'center', width: '100%' },
  divider: { width: 40, height: 3, borderRadius: 2, marginBottom: 8 },
  authorText: { fontSize: 18, fontWeight: '700' },
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingHorizontal: 8 },
  leftActions: { flexDirection: 'row', gap: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  reactionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  reactionBadgeActive: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  reactionCountActive: { color: '#059669' },
  addReactionContainer: { position: 'relative', zIndex: 10 },
  addReactionButton: { padding: 6 },
  emojiPopover: { position: 'absolute', bottom: 40, right: 0, backgroundColor: '#ffffff', borderRadius: 30, shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10, width: 240, paddingVertical: 10 },
  emojiScrollContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 16 },
  emojiButton: { padding: 2 },
  quickEmoji: { fontSize: 28 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Changed from flex-start for better touch area
    marginBottom: 12,
    zIndex: 10, // Forces the row to sit above everything else
    elevation: 10, // Same as zIndex but for Android
  },
  optionsButton: {
    padding: 8, // Larger area around the icon
    marginRight: -8, // Pulls it slightly to the right to align with the card
    zIndex: 20,
    elevation: 20,
  },
});