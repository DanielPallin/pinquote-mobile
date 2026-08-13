// app/(tabs)/profile/favorites.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Dimensions, ActivityIndicator, Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../services/supabase';

const { width } = Dimensions.get('window');
const PADDING_HORIZONTAL = 16;
const GAP = 8;
const CELL_SIZE = (width - (PADDING_HORIZONTAL * 2) - (GAP * 2)) / 3;

interface StyleConfig {
  backgroundColor?: string;
  textColor?: string;
}

interface FavoriteQuote {
  quote_id: string;
  quotes: {
    id: string;
    content: string;
    custom_author_name: string | null;
    live_photo_url: string | null;
    template: {
      style_config: StyleConfig;
    } | null;
  } | null;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          quote_id,
          quotes (
            id,
            content,
            custom_author_name,
            live_photo_url,
            template:templates(style_config)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setFavorites(data as unknown as FavoriteQuote[]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
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
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.quote_id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No Quotes Favorited Yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (!item.quotes) return null;
          
          const quote = item.quotes;
          const styleConfig = quote.template?.style_config || {};
          const bgColor = styleConfig.backgroundColor || '#ffffff';
          const textColor = styleConfig.textColor || '#334155';
          const hasImage = !!quote.live_photo_url;

          return (
            <TouchableOpacity 
              style={[styles.gridCell, { backgroundColor: hasImage ? '#000' : bgColor }]}
              activeOpacity={0.8}
              onPress={() => router.push(`/profile/quote/${item.quote_id}`)}
            >
              {hasImage && (
                <>
                  <Image source={{ uri: quote.live_photo_url as string }} style={StyleSheet.absoluteFill} />
                  <View style={styles.imageOverlay} />
                </>
              )}
              <Text 
                style={[styles.previewText, { color: hasImage ? '#ffffff' : textColor }]} 
                numberOfLines={4}
              >
                &ldquo;{quote.content}&rdquo;
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  columnWrapper: {
    gap: 8, 
    marginBottom: 8,
  },
  gridCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 16,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  previewText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 15,
    zIndex: 2,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
  }
});