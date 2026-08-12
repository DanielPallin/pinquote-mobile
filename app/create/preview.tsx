import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ImageBackground
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { useCreateQuoteStore } from '../../store/useCreateQuoteStore';

export default function PreviewQuoteScreen() {
  const router = useRouter();
  const { 
    mediaType, template, livePhotoUri, quoteText, 
    targetType, targetId, targetEmail, customName, reset 
  } = useCreateQuoteStore();
  
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'You must be logged in to publish.');
        setIsPublishing(false);
        return;
      }

      // TODO: Later on, if mediaType === 'live_photo', upload livePhotoUri to Supabase Storage here 
      // and get the public URL back before inserting into the quotes table.
      
      const { error } = await supabase
        .from('quotes')
        .insert({
          publisher_id: user.id,
          content: quoteText,
          template_id: mediaType === 'template' ? template?.id : null,
          live_photo_url: null, // Replace with Storage URL later when fully implementing photo upload
          quoted_user_id: targetType === 'user' ? targetId : null,
          quoted_email: targetType === 'email' ? targetEmail : null,
          custom_author_name: targetType === 'custom' ? customName : null
        });

      if (error) throw error;

      reset(); 
      router.replace('/(tabs)'); 

    } catch (error: any) {
      Alert.alert('Publish Failed', error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const isPhoto = mediaType === 'live_photo';
  const bgColor = isPhoto ? '#000000' : (template?.backgroundColor || '#000000');
  const textColor = isPhoto ? '#ffffff' : (template?.textColor || '#ffffff');

  const displayTarget = targetType === 'user' 
    ? 'PinQuote User' 
    : targetType === 'email' 
      ? 'Pending User'
      : customName;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.contextText}>
        <Text style={styles.boldText}>{displayTarget}</Text> has been quoted by <Text style={styles.boldText}>You</Text>
      </Text>

      <View style={styles.previewContainer}>
        {isPhoto ? (
          <ImageBackground source={{ uri: livePhotoUri! }} style={[styles.card, { overflow: 'hidden' }]}>
            <View style={styles.overlay} />
            <Text style={[styles.cardText, { color: textColor }, styles.photoTextShadow]}>
              {quoteText}
            </Text>
          </ImageBackground>
        ) : (
          <View style={[styles.card, { backgroundColor: bgColor }]}>
            <Text style={[styles.cardText, { color: textColor }]}>{quoteText}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.publishButton} onPress={handlePublish} disabled={isPublishing}>
          {isPublishing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.publishButtonText}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  iconButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  contextText: { textAlign: 'center', color: '#64748b', fontSize: 16, marginTop: 16 },
  boldText: { fontWeight: '800', color: '#0f172a' },
  previewContainer: { flex: 1, justifyContent: 'center', padding: 32 },
  card: { aspectRatio: 0.8, borderRadius: 24, padding: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  cardText: { fontSize: 28, fontWeight: '900', textAlign: 'center' },
  photoTextShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  footer: { padding: 24, paddingBottom: 40 },
  publishButton: { backgroundColor: '#0f172a', paddingVertical: 20, borderRadius: 20, alignItems: 'center' },
  publishButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
});