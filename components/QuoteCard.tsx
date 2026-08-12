import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Heart, MessageCircle, SmilePlus } from 'lucide-react-native';
import { TEMPLATES } from '../constants/templates';
import { FeedQuote } from '../types/feed';

type Props = {
  quote: FeedQuote;
  onReact?: (emoji: string, quoteId: string) => void;
  onFavorite?: (quoteId: string) => void;
  onOpenProfile?: (username: string) => void;
  onPressComments?: (quoteId: string) => void;
};

// Expanded list of premium emojis
const QUICK_EMOJIS = ['😂', '🔥', '❤️', '💀', '💯', '🙏', '👀', '✨', '😢', '😍'];

export default function QuoteCard({ quote, onReact, onFavorite, onOpenProfile, onPressComments }: Props) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const template = TEMPLATES.find(t => t.id === quote.template_id) || TEMPLATES[0];
  
  const authorName = quote.quoted_user?.username || quote.custom_author_name || 'Unknown';
  const publisherName = quote.publisher?.username || 'Someone';

  const handleReactionPress = (emoji: string) => {
    onReact?.(emoji, quote.id);
    setShowEmojiPicker(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.contextText}>
        <Text style={styles.boldText} onPress={() => onOpenProfile?.(authorName)}>{authorName}</Text> has been quoted by <Text style={styles.boldText} onPress={() => publisherName !== 'Someone' && onOpenProfile?.(publisherName)}>{publisherName}</Text>
      </Text>

      <View style={[styles.card, { backgroundColor: template.backgroundColor }]}>
        <Text style={[styles.quoteMark, { color: template.textColor }]}>“ ”</Text>
        <Text style={[styles.content, { color: template.textColor }]}>
          {quote.content}
        </Text>
        
        <View style={styles.authorContainer}>
          <View style={[styles.divider, { backgroundColor: template.textColor }]} />
          <Text style={[styles.authorText, { color: template.textColor }]}>
            -{authorName}
          </Text>
        </View>
      </View>

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

          {/* Reaction Button & Popover Wrapper */}
          <View style={styles.addReactionContainer}>
            <TouchableOpacity 
              style={styles.addReactionButton} 
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <SmilePlus size={20} color="#64748b" />
            </TouchableOpacity>

            {/* Quick Emoji Picker Popover */}
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
  contextText: { textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 12 },
  boldText: { fontWeight: '700', color: '#0f172a' },
  card: { borderRadius: 32, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 8 },
  quoteMark: { fontSize: 64, fontWeight: '900', lineHeight: 64, marginBottom: -10, opacity: 0.3 },
  content: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 24 },
  authorContainer: { alignItems: 'center', width: '100%' },
  divider: { width: 40, height: 3, borderRadius: 2, marginBottom: 8 },
  authorText: { fontSize: 18, fontWeight: '700' },
  
  // Action Bar Styles
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
  
  // Emoji Picker Styles
  addReactionContainer: { position: 'relative', zIndex: 10 },
  addReactionButton: { padding: 6 },
  emojiPopover: { 
    position: 'absolute', 
    bottom: 40, 
    right: 0, 
    backgroundColor: '#fff', 
    borderRadius: 30, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 16, 
    elevation: 10, 
    width: 240, // Fixed width prevents border clipping
    paddingVertical: 10,
  },
  emojiScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 16, // Spacing between emojis in the scroll view
  },
  emojiButton: {
    padding: 2,
  },
  quickEmoji: { 
    fontSize: 28 
  },
});