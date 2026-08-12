import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ImageBackground
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
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

      let finalLivePhotoUrl = null;

      // 1. Upload Live Photo to Supabase Storage if applicable
      if (mediaType === 'live_photo' && livePhotoUri) {
        const base64 = await FileSystem.readAsStringAsync(livePhotoUri, { encoding: 'base64' });
        const fileName = `${user.id}/${Date.now()}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('quotes_media')
          .upload(fileName, decode(base64), { contentType: 'image/jpeg' });
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('quotes_media')
          .getPublicUrl(fileName);
          
        finalLivePhotoUrl = publicUrlData.publicUrl;
      }
      
      // 2. Insert into the quotes database and return the inserted row
      const { data: newQuote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          publisher_id: user.id,
          content: quoteText,
          template_id: mediaType === 'template' ? template?.id : null,
          live_photo_url: finalLivePhotoUrl, 
          quoted_user_id: targetType === 'user' ? targetId : null,
          quoted_email: targetType === 'email' ? targetEmail : null,
          custom_author_name: targetType === 'custom' ? customName : null
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // 3. Handle "Someone Quoted Me" Notification
      if (targetType === 'user' && targetId && newQuote) {
        // Check if the target user wants quote notifications
        const { data: targetProfile } = await supabase
          .from('profiles')
          .select('notify_quotes')
          .eq('id', targetId)
          .single();

        if (targetProfile?.notify_quotes) {
          await supabase.from('notifications').insert({
            receiver_id: targetId,
            actor_id: user.id,
            type: 'quote',
            quote_id: newQuote.id
          });
        }
      }

      // 4. Update User Template Interactions for smart sorting
      if (mediaType === 'template' && template?.id) {
        const { data: existingInteraction } = await supabase
          .from('user_template_interactions')
          .select('id, use_count')
          .eq('user_id', user.id)
          .eq('template_id', template.id)
          .single();

        if (existingInteraction) {
          // Update existing interaction
          await supabase
            .from('user_template_interactions')
            .update({
              use_count: existingInteraction.use_count + 1,
              last_used_at: new Date().toISOString()
            })
            .eq('id', existingInteraction.id);
        } else {
          // Create new interaction record
          await supabase
            .from('user_template_interactions')
            .insert({
              user_id: user.id,
              template_id: template.id,
              use_count: 1,
              last_used_at: new Date().toISOString()
            });
        }
      }

      reset(); 
      router.replace('/(tabs)'); 

    } catch (error: any) {
      console.error('Publishing error:', error);
      Alert.alert('Publish Failed', error.message || 'An unknown error occurred.');
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
            {/* Top Left Badge for Template Name */}
            {template?.name && (
              <View style={[styles.topLeftBadge, { backgroundColor: `${textColor}15` }]}>
                <Text style={[styles.badgeText, { color: textColor }]}>
                  {template.name}
                </Text>
              </View>
            )}
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
  card: { 
    aspectRatio: 0.8, 
    borderRadius: 24, 
    padding: 32, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 20, 
    elevation: 10,
    position: 'relative'
  },
  topLeftBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  badgeText: { 
    fontSize: 14, 
    fontWeight: '800',
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  cardText: { fontSize: 28, fontWeight: '900', textAlign: 'center' },
  photoTextShadow: { textShadowColor: 'rgba(0, 0, 0, 0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  footer: { padding: 24, paddingBottom: 40 },
  publishButton: { backgroundColor: '#0f172a', paddingVertical: 20, borderRadius: 20, alignItems: 'center' },
  publishButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
});