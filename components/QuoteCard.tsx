// components/QuoteCard.tsx
import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Image, 
  ActivityIndicator, 
  Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { User, MessageCircle, Star, SmilePlus, Share2 } from 'lucide-react-native';
import { FeedQuote, GroupedReaction } from '../types/feed';
import { BlendBackground } from './ui/BlendBackground';

// Typer som mappar mot din befintliga kod
interface QuoteCardProps {
  quote: FeedQuote;
  isExpanded?: boolean;
  onReact: (emoji: string, quoteId: string, type: 'quote', publisherId?: string) => void;
  onExpand?: (quote: FeedQuote) => void;
  onFavorite: (quoteId: string) => void;
  onOpenProfile: (username: string) => void;
}

// Hjälpfunktion för dynamisk textstorlek (Native konvertering)
const getQuoteFontSize = (text: string) => {
  const len = text.length;
  if (len < 40) return 36; // text-4xl
  if (len < 80) return 30; // text-3xl
  if (len < 140) return 24; // text-2xl
  if (len < 200) return 20; // text-xl
  return 18; // text-lg
};

export const QuoteCard = ({ 
  quote, 
  isExpanded = false, 
  onReact, 
  onExpand, 
  onFavorite,
  onOpenProfile
}: QuoteCardProps) => {
  const [isExporting, setIsExporting] = useState(false);
  // Vi skapar en referens till det vi vill fota
  const cardGraphicRef = useRef<View>(null);

  const publisherName = quote.publisher?.username || 'Unknown';
  const isRegisteredUser = !!quote.quoted_user?.username;
  
  let targetName = 'Unknown';
  if (quote.custom_author_name?.trim()) targetName = quote.custom_author_name;
  else if (isRegisteredUser) targetName = quote.quoted_user.username;
  else if (quote.quoted_email?.trim()) targetName = 'Pending Invite';

  const displayHandle = isRegisteredUser ? `@${targetName.toLowerCase().replace(/[^a-z0-9]/g, '')}` : null;
  const targetAvatarUrl = quote.quoted_user?.avatar_url;

  // Hantering av delning (Share) i Native
  const handleExport = async () => {
    if (!cardGraphicRef.current || isExporting) return;
    
    setIsExporting(true);
    try {
      // 1. Ta en skärmdump av komponenten
      const uri = await captureRef(cardGraphicRef, {
        format: "png",
        quality: 1,
      });

      // 2. Kolla om vi kan dela och visa systemets delningsmeny
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Share on PinQuo',
          mimeType: 'image/png',
        });
      }
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={[styles.container, isExpanded && styles.expandedContainer]}>
      {/* HEADER: Publicerad av */}
      <View style={[styles.header, isExpanded && styles.expandedHeader]}>
        <View style={styles.headerLeft}>
          <Pressable 
            style={styles.avatarMini} 
            onPress={() => onOpenProfile(publisherName)}
          >
            <User size={20} color="#94a3b8" />
          </Pressable>
          <Text style={styles.headerText}>
            Published by{' '}
            <Text 
              style={styles.headerBoldText} 
              onPress={() => onOpenProfile(publisherName)}
            >
              {publisherName}
            </Text>
          </Text>
        </View>
      </View>

{/* MEME CARD GRAPHIC (This is what we capture) */}
<Pressable 
  onPress={() => !isExpanded && onExpand?.(quote)}
  style={({ pressed }) => [
    styles.cardGraphicWrapper,
    !isExpanded && pressed && styles.cardGraphicPressed,
    isExpanded && styles.cardGraphicExpanded
  ]}
>
  <ViewShot ref={cardGraphicRef} options={{ format: 'png', quality: 1 }}>
    <View style={styles.cardGraphicContent}>
      
      {/* Inside components/QuoteCard.tsx (Replacing the imageHeader section) */}
      <View style={styles.imageHeader}>
        {quote.template ? (
          <LinearGradient
            colors={['#1e293b', '#0f172a']} // Map from your template config
            style={StyleSheet.absoluteFillObject}
          />
        ) : targetAvatarUrl ? (
          // Our new Skia integration!
          <BlendBackground 
            imageUrl={targetAvatarUrl} 
            baseColor="#958ce4" // You can extract prominent colors from the image later!
            width={80} // Make sure to pass the actual width of your card
            height={192} // h-48 equivalent
          />
        ) : null}
      </View>

      {/* Quote Text */}
      <View style={styles.quoteBody}>
        <Text style={styles.quoteMarks}>“ ”</Text>
        <Text style={[styles.quoteText, { fontSize: getQuoteFontSize(quote.content) }]}>
          {quote.content}
        </Text>

        <View style={styles.authorSection}>
          <View style={styles.divider} />
          <Text style={[
            styles.authorName, 
            !isRegisteredUser && !quote.custom_author_name && styles.authorNameItalic
          ]}>
            {targetName}
          </Text>
          {displayHandle && (
            <Text style={styles.authorHandle}>{displayHandle}</Text>
          )}
        </View>
      </View>
      
    </View>
  </ViewShot>
</Pressable>

      {/* SOCIAL ACTIONS BAR */}
      <View style={[styles.actionsContainer, isExpanded && styles.expandedActionsContainer]}>
        
        {/* Vänster: Reaktioner */}
        <View style={styles.reactionsRow}>
          {quote.groupedReactions.map((r: GroupedReaction) => (
            <Pressable
              key={r.emoji}
              onPress={() => onReact(r.emoji, quote.id, 'quote', quote.publisher?.id)}
              style={[
                styles.reactionPill,
                r.hasReacted && styles.reactionPillActive
              ]}
            >
              <Text style={styles.emojiText}>{r.emoji}</Text>
              <Text style={[styles.reactionCount, r.hasReacted && styles.reactionCountActive]}>
                {r.count}
              </Text>
            </Pressable>
          ))}

          <Pressable 
            style={styles.addReactionBtn}
            // Här skulle du öppna din Native Emoji Picker modal/bottom-sheet
            onPress={() => console.log('Open Emoji Picker')}
          >
            <SmilePlus size={16} color="#94a3b8" />
          </Pressable>
        </View>

        {/* Höger: Ikoner (Dela, Kommentera, Favorit) */}
        <View style={styles.iconRow}>
          <Pressable onPress={handleExport} disabled={isExporting} style={styles.iconBtn}>
            {isExporting ? <ActivityIndicator size="small" color="#94a3b8" /> : <Share2 size={22} color="#94a3b8" />}
          </Pressable>

          {!isExpanded && (
            <Pressable onPress={() => onExpand?.(quote)} style={styles.iconBtnWithText}>
              <MessageCircle size={22} color="#94a3b8" />
              <Text style={styles.iconText}>{quote.commentCount}</Text>
            </Pressable>
          )}

          <Pressable onPress={() => onFavorite(quote.id)} style={styles.iconBtn}>
            <Star 
              size={24} 
              color={quote.isFavorited ? "#facc15" : "#94a3b8"} 
              fill={quote.isFavorited ? "#facc15" : "transparent"} 
            />
          </Pressable>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 40,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
  },
  expandedContainer: {
    padding: 0,
    paddingBottom: 24,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  expandedHeader: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  headerText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  headerBoldText: {
    color: '#1e293b',
    fontWeight: '700',
  },
  cardGraphicWrapper: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  cardGraphicPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  cardGraphicExpanded: {
    borderWidth: 0,
    borderRadius: 0,
  },
  cardGraphicContent: {
    backgroundColor: '#fff',
  },
  imageHeader: {
    height: 192, // h-48
    width: '100%',
  },
  gradientFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 128, // h-32
  },
  quoteBody: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
    marginTop: -40, // Dra upp texten över bakgrunden
  },
  quoteMarks: {
    fontSize: 70,
    fontWeight: '900', // font-black
    color: '#000',
    lineHeight: 80,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  quoteText: {
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
    lineHeight: 40,
  },
  authorSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: '#000',
    marginBottom: 12,
  },
  authorName: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
    letterSpacing: 0.5,
  },
  authorNameItalic: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  authorHandle: {
    color: '#94a3b8',
    fontWeight: '500',
    fontSize: 14,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 12,
  },
  expandedActionsContainer: {
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    paddingBottom: 16,
  },
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  reactionPillActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  emojiText: {
    fontSize: 14,
    marginRight: 6,
  },
  reactionCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  reactionCountActive: {
    color: '#047857',
  },
  addReactionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 8,
    marginLeft: 8,
  },
  iconBtnWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: 8,
  },
  iconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    marginLeft: 6,
  }
});