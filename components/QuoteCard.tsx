import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TEMPLATES } from '../constants/templates';

// Define the shape of our data based on your Supabase query
export type FeedQuote = {
  id: string;
  content: string;
  created_at: string;
  custom_author_name: string | null;
  template_id: string | null;
  publisher: { username: string } | null;
  quoted_user: { username: string; avatar_url: string | null } | null;
};

type Props = {
  quote: FeedQuote;
  onReact?: (emoji: string, quoteId: string) => void;
  onFavorite?: (quoteId: string) => void;
  onOpenProfile?: (username: string) => void;
};

export default function QuoteCard({ quote }: Props) {
  // Find the matching template colors, fallback to a default if not found
  const template = TEMPLATES.find(t => t.id === quote.template_id) || TEMPLATES[0];
  
  // Determine who said the quote (prioritize registered user, then custom name)
  const authorName = quote.quoted_user?.username || quote.custom_author_name || 'Unknown';
  const publisherName = quote.publisher?.username || 'Someone';

  return (
    <View style={styles.container}>
      <Text style={styles.contextText}>
        <Text style={styles.boldText}>{authorName}</Text> has been quoted by <Text style={styles.boldText}>{publisherName}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  contextText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    marginBottom: 12,
  },
  boldText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  card: {
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  quoteMark: {
    fontSize: 64,
    fontWeight: '900',
    lineHeight: 64,
    marginBottom: -10,
    opacity: 0.3,
  },
  content: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 24,
  },
  authorContainer: {
    alignItems: 'center',
    width: '100%',
  },
  divider: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginBottom: 8,
  },
  authorText: {
    fontSize: 18,
    fontWeight: '700',
  },
});