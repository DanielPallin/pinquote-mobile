// app/(tabs)/create/index.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, X, Camera as CameraIcon, Star } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../../services/supabase';
import { useCreateQuoteStore, QuoteTemplate } from '../../store/useCreateQuoteStore';

interface ExtendedTemplate extends QuoteTemplate {
  category: string;
  isFavorite: boolean;
  lastUsedAt: string | null;
}

export default function SelectTemplateScreen() {
  const router = useRouter();
  const { setMediaAsTemplate, setMediaAsLivePhoto } = useCreateQuoteStore();

  const [templates, setTemplates] = useState<ExtendedTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch all templates from DB
      const { data: templatesData, error: templatesError } = await supabase
        .from('templates')
        .select('*');

      if (templatesError) throw templatesError;

      // Fetch current user's interactions (favorites, use counts)
      let interactionsData: any[] = [];
      if (user) {
        const { data: interactions, error: interactionsError } = await supabase
          .from('user_template_interactions')
          .select('*')
          .eq('user_id', user.id);
          
        if (!interactionsError && interactions) {
          interactionsData = interactions;
        }
      }

      // Map the data and fix the color properties from style_config
      const formattedTemplates: ExtendedTemplate[] = templatesData.map((t: any) => {
        const interaction = interactionsData.find(i => i.template_id === t.id);
        
        // Ensure we extract the HEX color correctly from the JSONB column
        const bgColor = t.style_config?.backgroundColor || '#000000';
        const txtColor = t.style_config?.textColor || '#ffffff';

        return {
          id: t.id,
          name: t.name,
          backgroundColor: bgColor,
          textColor: txtColor,
          isPro: t.is_pro_only,
          category: t.category || 'General',
          isFavorite: interaction?.is_favorite || false,
          lastUsedAt: interaction?.last_used_at || null,
        };
      });

      // Implement the Smart Sorting Logic
      formattedTemplates.sort((a, b) => {
        // Priority 1: Last used first
        const timeA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
        const timeB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;

        // Priority 2: Favorites
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;

        // Priority 3: Alphabetical by category
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;

        // Fallback: Alphabetical by template name
        return a.name.localeCompare(b.name);
      });

      setTemplates(formattedTemplates);

    } catch (error) {
      console.error('Error fetching templates:', error);
      Alert.alert('Error', 'Could not load templates from database.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (template: ExtendedTemplate) => {
    if (template.isPro) {
      Alert.alert('Pro Feature', 'You need PinQuote PRO to use this template!');
      return;
    }
    
    // We pass it to the store. Remember to update `use_count` and `last_used_at` 
    setMediaAsTemplate(template);
    router.push('/create/write');
  };

  const handleOpenCamera = async () => {
    if (!permission || !permission.granted) {
      const permResult = await requestPermission();
      if (!permResult.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to take live photos.');
        return;
      }
    }
    setShowCamera(true);
  };

  const handleCapturePhoto = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({ quality: 0.8 });
        if (photo?.uri) {
          setMediaAsLivePhoto(photo.uri);
          setShowCamera(false);
          router.push('/create/write');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take photo.');
      }
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={StyleSheet.absoluteFillObject} ref={(ref) => setCameraRef(ref)} />
        <View style={styles.cameraOverlay}>
          <TouchableOpacity onPress={() => setShowCamera(false)} style={styles.cameraCloseButton}>
            <X size={28} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCapturePhoto} style={styles.captureButtonOuter}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderTemplate = ({ item }: { item: ExtendedTemplate }) => (
    <TouchableOpacity 
      style={[styles.templateCard, { backgroundColor: item.backgroundColor }]}
      onPress={() => handleSelectTemplate(item)}
      activeOpacity={0.8}
    >
      {/* Name Badge in Top Left */}
      <View style={[styles.topLeftBadge, { backgroundColor: `${item.textColor}15` }]}>
        <Text style={[styles.badgeText, { color: item.textColor }]}>
          {item.name}
        </Text>
      </View>

      {/* Category Text in Bottom Left */}
      <Text style={[styles.categoryText, { color: item.textColor }]}>
        {item.category}
      </Text>

      {/* Pro Badge in Top Right */}
      {item.isPro && (
        <View style={styles.proBadge}>
          <Lock size={14} color="#ffffff" />
        </View>
      )}

      {/* Favorite Star in Bottom Right */}
      {item.isFavorite && (
        <View style={styles.favoriteBadge}>
          <Star size={16} color="#fbbf24" fill="#fbbf24" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Vibe</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleOpenCamera} style={styles.iconButton}>
            <CameraIcon size={22} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <X size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={renderTemplate}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconButton: { padding: 10, backgroundColor: '#e2e8f0', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 16 },
  templateCard: { 
    flex: 1, 
    aspectRatio: 0.8, 
    marginHorizontal: 8, 
    borderRadius: 20, 
    padding: 12,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    shadowColor: '#000000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 5,
    position: 'relative'
  },
  topLeftBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: { 
    fontSize: 13, 
    fontWeight: '800',
  },
  proBadge: { 
    position: 'absolute', 
    top: 12, 
    right: 12, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    padding: 6, 
    borderRadius: 20 
  },
  favoriteBadge: { 
    position: 'absolute', 
    bottom: 12, 
    right: 12, 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    padding: 6, 
    borderRadius: 20,
    shadowColor: '#000000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4,
  },
  
  // Camera styles
  cameraContainer: { flex: 1, backgroundColor: '#000000' },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', paddingVertical: 60, paddingHorizontal: 24, alignItems: 'center' },
  cameraCloseButton: { alignSelf: 'flex-start', padding: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 30 },
  captureButtonOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#ffffff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  captureButtonInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ffffff' }
});