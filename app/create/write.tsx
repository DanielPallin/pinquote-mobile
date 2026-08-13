// app/create/write.tsx
import React, { useEffect } from 'react';
import { 
  View, TextInput, StyleSheet, TouchableOpacity, Text, 
  KeyboardAvoidingView, Platform, ImageBackground 
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCreateQuoteStore } from '../../store/useCreateQuoteStore';

export default function WriteQuoteScreen() {
  const router = useRouter();
  const { mediaType, template, livePhotoUri, quoteText, setQuoteText } = useCreateQuoteStore();

  // Safety check handled inside useEffect to avoid rendering state updates
  useEffect(() => {
    if (!template && !livePhotoUri) {
      router.back();
    }
  }, [template, livePhotoUri]);

  if (!template && !livePhotoUri) {
    return <View style={styles.container} />;
  }

  const isPhoto = mediaType === 'live_photo';
  const textColor = isPhoto ? '#ffffff' : (template?.textColor || '#ffffff');
  const bgColor = isPhoto ? '#000000' : (template?.backgroundColor || '#000000');

  const ContentWrapper: React.ComponentType<any> = isPhoto ? ImageBackground : View;
  const wrapperProps = isPhoto 
    ? { source: { uri: livePhotoUri! }, style: styles.wrapper } 
    : { style: [styles.wrapper, { backgroundColor: bgColor }] };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ContentWrapper {...wrapperProps}>
        {isPhoto && <View style={styles.overlay} />}

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft size={24} color={textColor} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.nextButton, 
              { backgroundColor: textColor, opacity: quoteText.trim().length > 0 ? 1 : 0.5 }
            ]} 
            onPress={() => router.push('/create/target')} 
            disabled={!quoteText.trim()}
          >
            <Text style={[styles.nextButtonText, { color: bgColor }]}>Next</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input, 
              { color: textColor },
              isPhoto && styles.photoTextShadow
            ]}
            placeholder="Enter Quote..."
            placeholderTextColor={isPhoto ? 'rgba(255,255,255,0.7)' : `${textColor}80`}
            multiline
            autoFocus
            value={quoteText}
            onChangeText={setQuoteText}
          />
        </View>
      </ContentWrapper>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  wrapper: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  iconButton: { padding: 8 },
  nextButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  nextButtonText: { fontSize: 16, fontWeight: '700' },
  inputContainer: { flex: 1, paddingHorizontal: 32, paddingTop: 40 },
  input: { fontSize: 32, fontWeight: '900', textAlign: 'center' },
  photoTextShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  }
});