import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, X, Camera as CameraIcon } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCreateQuoteStore, QuoteTemplate } from '../../store/useCreateQuoteStore';
import { TEMPLATES } from '../../constants/templates';

export default function SelectTemplateScreen() {
  const router = useRouter();
  const { setMediaAsTemplate, setMediaAsLivePhoto } = useCreateQuoteStore();

  const [showCamera, setShowCamera] = useState(false);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const handleSelectTemplate = (template: QuoteTemplate) => {
    if (template.isPro) {
      Alert.alert('Pro Feature', 'You need PinQuote PRO to use this template!');
      return;
    }
    
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

  // If camera mode is active, render the camera view
  if (showCamera) {
    return (
      <CameraView style={styles.cameraContainer} ref={(ref) => setCameraRef(ref)}>
        <View style={styles.cameraOverlay}>
          <TouchableOpacity onPress={() => setShowCamera(false)} style={styles.cameraCloseButton}>
            <X size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCapturePhoto} style={styles.captureButtonOuter}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
    );
  }

  const renderTemplate = ({ item }: { item: QuoteTemplate }) => (
    <TouchableOpacity 
      style={[styles.templateCard, { backgroundColor: item.backgroundColor }]}
      onPress={() => handleSelectTemplate(item)}
      activeOpacity={0.8}
    >
      <Text style={[styles.templateName, { color: item.textColor }]}>
        {item.name}
      </Text>
      {item.isPro && (
        <View style={styles.proBadge}>
          <Lock size={16} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Vibe</Text>
        
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Camera Button */}
          <TouchableOpacity onPress={handleOpenCamera} style={styles.cameraButton}>
            <CameraIcon size={22} color="#0f172a" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid */}
      <FlatList
        data={TEMPLATES}
        keyExtractor={(item) => item.id}
        renderItem={renderTemplate}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  closeButton: { padding: 8, backgroundColor: '#e2e8f0', borderRadius: 30 },
  cameraButton: { padding: 10, backgroundColor: '#e2e8f0', borderRadius: 30, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 16 },
  templateCard: { flex: 1, aspectRatio: 0.8, marginHorizontal: 8, borderRadius: 20, padding: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  templateName: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  proBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 20 },
  
  // Camera styles
  cameraContainer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  cameraOverlay: { width: '100%', height: '100%', justifyContent: 'space-between', paddingVertical: 60, paddingHorizontal: 24, alignItems: 'center' },
  cameraCloseButton: { alignSelf: 'flex-start', padding: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 30 },
  captureButtonOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  captureButtonInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' }
});