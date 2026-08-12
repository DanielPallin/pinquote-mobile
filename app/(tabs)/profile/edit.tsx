import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../../services/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCurrentProfile();
  }, []);

  const fetchCurrentProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');
      
      setUserId(user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('username, bio, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setUsername(data.username || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching profile for edit:', error);
      Alert.alert('Error', 'Could not load your profile details.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Perfect square for avatars
      quality: 0.5, // Compress to save storage
    });

    if (!result.canceled) {
      setNewAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    if (!username.trim()) {
      Alert.alert('Hold up', 'Username cannot be empty.');
      return;
    }

    setIsSaving(true);
    let finalAvatarUrl = avatarUrl;

    try {
      // 1. Upload new image if selected
      if (newAvatarUri) {
        const base64 = await FileSystem.readAsStringAsync(newAvatarUri, { encoding: 'base64' });
        const fileName = `${userId}/${Date.now()}.jpg`;
        
        // Assuming you have a storage bucket named 'avatars'
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, decode(base64), { contentType: 'image/jpeg', upsert: true });
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        finalAvatarUrl = publicUrlData.publicUrl;
      }

      // 2. Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          bio: bio.trim(),
          avatar_url: finalAvatarUrl,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 3. Go back to profile screen
      router.back();

    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Failed to save', error.message || 'An unknown error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  const displayAvatar = newAvatarUri || avatarUrl;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Avatar Editor */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {username ? username.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Camera size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Inputs */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Your username"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell the world about yourself..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            maxLength={160}
          />
          <Text style={styles.charCount}>{bio.length}/160</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
          onPress={handleSave} 
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  iconButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  content: { padding: 24 },
  
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#cbd5e1' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholderText: { fontSize: 36, fontWeight: '800', color: '#64748b' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0f172a', padding: 8, borderRadius: 20, borderWidth: 3, borderColor: '#f8fafc' },
  avatarHint: { marginTop: 12, fontSize: 14, color: '#64748b', fontWeight: '600' },

  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 16, fontSize: 16, color: '#0f172a', fontWeight: '500' },
  textArea: { height: 120, paddingTop: 16, textAlignVertical: 'top' },
  charCount: { textAlign: 'right', marginTop: 8, fontSize: 12, color: '#94a3b8', fontWeight: '600' },

  footer: { padding: 2, paddingBottom: 200, marginTop: 'auto' },
  saveButton: { backgroundColor: '#0f172a', paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
});