// app/create/preview.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { useCreateQuoteStore } from '../../store/useCreateQuoteStore';

// Vi kan återanvända QuoteCard från tidigare konversation för att rendera förhandsgranskningen,
// jag lägger in en platshållare här för presentationen.
import { QuoteCard } from '../../components/QuoteCard'; 

export default function PreviewScreen() {
  const router = useRouter();
  const store = useCreateQuoteStore();
  const [isPublishing, setIsPublishing] = useState(false);

  const displayTarget = store.target?.username || store.target?.customName || store.target?.email || 'Unknown';

  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // 1. Skapa posten i tabellen `quotes`
      const { error } = await supabase.from('quotes').insert({
        content: store.quoteText,
        publisher_id: user.id,
        template_id: store.bgType === 'template' ? store.selectedTemplate?.id : null,
        quoted_user_id: store.target?.id || null,
        quoted_email: store.target?.email || null,
        custom_author_name: store.target?.customName || null
      });

      if (error) throw error;

      // 2. Rensa store och gå till Feed
      store.resetFlow();
      router.replace('/(tabs)/index'); // Replace istället för push så man inte kan backa till skapandet
      
    } catch (err) {
      console.error("Failed to publish:", err);
      setIsPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={32} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>PinQuo</Text>
        <Text style={styles.subtitle}>Quote Preview</Text>
      </View>

      <View style={styles.content}>
        
        {/* Här återanvänder vi komponent-logiken vi byggde i QuoteCard för att visa kortet */}
        <View style={styles.cardPlaceholder}>
           <Text style={styles.cardText}>"{store.quoteText}"</Text>
           <Text style={styles.cardAuthor}>- {displayTarget}</Text>
        </View>

        <TouchableOpacity 
          style={styles.publishBtn}
          onPress={handlePublish}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <ActivityIndicator size="large" color="#022c22" />
          ) : (
            <>
              <Text style={styles.publishBtnText}>Publish</Text>
              <CheckCircle2 size={32} color="#022c22" />
            </>
          )}
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { alignItems: 'center', marginBottom: 24, paddingHorizontal: 24, position: 'relative' },
  backBtn: { position: 'absolute', left: 24, top: 0, padding: 8, zIndex: 10 },
  title: { fontSize: 40, fontWeight: '900', color: '#000' },
  subtitle: { fontSize: 20, fontWeight: '700', color: '#64748b', textDecorationLine: 'underline', marginTop: 8 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, justifyContent: 'center' },
  cardPlaceholder: { width: '100%', height: 400, backgroundColor: '#fff', borderRadius: 32, padding: 24, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, marginBottom: 40 },
  cardText: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  cardAuthor: { fontSize: 18, fontWeight: '900', color: '#64748b' },
  publishBtn: { width: '100%', flexDirection: 'row', backgroundColor: '#bbf7d0', paddingVertical: 24, borderRadius: 40, alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 4, borderColor: '#a7f3d0' },
  publishBtnText: { fontSize: 28, fontWeight: '900', color: '#022c22' }
});