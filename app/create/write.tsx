// app/create/write.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  SafeAreaView, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Camera } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { useCreateQuoteStore } from '../../src/store/useCreateQuoteStore';

export default function WriteQuoteScreen() {
  const router = useRouter();
  const store = useCreateQuoteStore();
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  const displayTarget = store.target?.username || store.target?.customName || store.target?.email || 'Unknown';
  const isExistingUser = !!store.target?.id;

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from('templates')
        .select('id, name, style_config, is_pro_only')
        .eq('is_pro_only', false)
        .order('created_at', { ascending: true });

      if (data) {
        setTemplates(data);
        if (!store.selectedTemplate) {
          store.setSelectedTemplate({ id: data[0].id, gradient: data[0].style_config.gradient });
        }
      }
      setIsLoadingTemplates(false);
    };
    fetchTemplates();
  }, []);

  const handlePreview = () => {
    if (store.quoteText.trim().length > 0) {
      router.push('/create/preview');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={32} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>PinQuo</Text>
          <Text style={styles.subtitle}>Quoting {displayTarget}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.proBanner}>
            <View style={styles.proRow}>
              <Camera size={24} color="#94a3b8" />
              <Text style={styles.proText}>Snap Live-Photo (PRO)</Text>
            </View>
            <Text style={styles.proSub}>Coming in v2.0</Text>
          </View>

          <Text style={styles.orDivider}>OR</Text>

          {isExistingUser && (
            <>
              <TouchableOpacity 
                style={[styles.avatarBtn, store.bgType === 'avatar' && styles.avatarBtnActive]}
                onPress={() => store.setBgType('avatar')}
              >
                <Text style={[styles.avatarBtnText, store.bgType === 'avatar' && styles.avatarBtnTextActive]}>
                  Use Quoted Users Avatar
                </Text>
              </TouchableOpacity>
              <Text style={styles.orDivider}>OR</Text>
            </>
          )}

          <Text style={styles.sectionTitle}>Choose template</Text>
          
          {isLoadingTemplates ? (
            <ActivityIndicator size="large" color="#94a3b8" style={{ marginVertical: 20 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
              {templates.map((tpl) => {
                const isSelected = store.bgType === 'template' && store.selectedTemplate?.id === tpl.id;
                return (
                  <TouchableOpacity 
                    key={tpl.id} 
                    style={styles.templateItem}
                    onPress={() => {
                      store.setBgType('template');
                      store.setSelectedTemplate({ id: tpl.id, gradient: tpl.style_config.gradient });
                    }}
                  >
                    <View style={[styles.templatePreview, isSelected && styles.templatePreviewActive]}>
                       {isSelected && <CheckCircle2 size={32} color="#047857" style={styles.checkIcon} />}
                    </View>
                    <Text style={styles.templateName}>{tpl.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Quote:</Text>
          <View style={styles.quoteInputContainer}>
            <Text style={styles.quoteMarks}>“</Text>
            <TextInput
              style={styles.quoteInput}
              multiline
              value={store.quoteText}
              onChangeText={store.setQuoteText}
              placeholder="Type the quote here..."
              placeholderTextColor="#94a3b8"
            />
            <Text style={styles.quoteMarksRight}>”</Text>
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.previewBtn, !store.quoteText.trim() && styles.previewBtnDisabled]}
            onPress={handlePreview}
            disabled={!store.quoteText.trim()}
          >
            <Text style={styles.previewBtnText}>Preview</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles omdöpta och anpassade från Next.js Tailwind-klasser till React Native
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex1: { flex: 1 },
  header: { alignItems: 'center', marginBottom: 24, paddingHorizontal: 24, position: 'relative' },
  backBtn: { position: 'absolute', left: 24, top: 0, padding: 8, zIndex: 10 },
  title: { fontSize: 32, fontWeight: '900', color: '#000' },
  subtitle: { fontSize: 14, fontWeight: '700', color: '#64748b', marginTop: 4 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  proBanner: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 28, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', alignItems: 'center', opacity: 0.7 },
  proRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  proText: { fontSize: 16, fontWeight: '900', color: '#94a3b8' },
  proSub: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
  orDivider: { textAlign: 'center', fontSize: 12, fontWeight: '900', color: '#cbd5e1', letterSpacing: 2, marginVertical: 16 },
  avatarBtn: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 28, alignItems: 'center' },
  avatarBtnActive: { backgroundColor: '#bbf7d0', borderWidth: 4, borderColor: '#86efac' },
  avatarBtnText: { fontSize: 16, fontWeight: '900', color: '#334155' },
  avatarBtnTextActive: { color: '#022c22' },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 12, textAlign: 'center' },
  templateScroll: { flexDirection: 'row' },
  templateItem: { alignItems: 'center', marginRight: 16 },
  templatePreview: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  templatePreviewActive: { borderWidth: 4, borderColor: '#34d399', transform: [{ scale: 1.05 }] },
  checkIcon: { backgroundColor: '#fff', borderRadius: 16 },
  templateName: { fontSize: 12, fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginTop: 8 },
  quoteInputContainer: { backgroundColor: '#f8fafc', borderRadius: 36, padding: 24, minHeight: 180, position: 'relative' },
  quoteMarks: { position: 'absolute', top: 16, left: 16, fontSize: 40, color: '#cbd5e1', fontWeight: '900' },
  quoteMarksRight: { position: 'absolute', bottom: 16, right: 16, fontSize: 40, color: '#cbd5e1', fontWeight: '900' },
  quoteInput: { flex: 1, fontSize: 20, fontWeight: '700', color: '#0f172a', textAlign: 'center', marginTop: 24, marginBottom: 24 },
  footer: { padding: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  previewBtn: { backgroundColor: '#bbf7d0', paddingVertical: 20, borderRadius: 40, alignItems: 'center' },
  previewBtnDisabled: { opacity: 0.5 },
  previewBtnText: { fontSize: 20, fontWeight: '900', color: '#022c22' }
});