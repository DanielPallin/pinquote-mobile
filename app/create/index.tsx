// app/create/index.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Loader2 } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { useCreateQuoteStore } from '../../store/useCreateQuoteStore';

type Profile = { id: string; username: string; avatar_url: string | null };

export default function CreateQuoteScreen() {
  const router = useRouter();
  const setTarget = useCreateQuoteStore((state) => state.setTarget);

  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');

  // Söklogik med Debounce
  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.trim().length < 2) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${searchTerm}%`)
        .limit(3);

      if (!error && data) setResults(data);
      setIsSearching(false);
    };

    const delayDebounceFn = setTimeout(() => { searchUsers(); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleContinue = () => {
    if (selectedUser) {
      setTarget({ id: selectedUser.id, username: selectedUser.username, avatarUrl: selectedUser.avatar_url || undefined });
    } else if (inviteEmail) {
      setTarget({ email: inviteEmail });
    } else if (searchTerm.trim().length > 0) {
      setTarget({ customName: searchTerm.trim() });
    } else {
      return;
    }
    router.push('/create/write');
  };

  const isButtonDisabled = !selectedUser && !inviteEmail && searchTerm.trim().length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={32} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>PinQuo</Text>
          <Text style={styles.subtitle}>Create a Quote</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.questionText}>Who do you want to quote?</Text>
          
          <Text style={styles.label}>Username or Custom Name</Text>
          <TextInput
            style={styles.input}
            value={searchTerm}
            onChangeText={(text) => {
              setSearchTerm(text);
              setSelectedUser(null);
              setInviteEmail('');
            }}
            placeholder="Search or type a name..."
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />

          <View style={styles.resultsContainer}>
            {isSearching ? (
              <ActivityIndicator size="large" color="#94a3b8" style={{ marginTop: 20 }} />
            ) : results.length > 0 && !selectedUser ? (
              results.map((profile) => (
                <TouchableOpacity
                  key={profile.id}
                  style={styles.resultItem}
                  onPress={() => {
                    setSelectedUser(profile);
                    setSearchTerm(profile.username);
                    setResults([]);
                  }}
                >
                  <Text style={styles.resultText}>{profile.username}</Text>
                </TouchableOpacity>
              ))
            ) : selectedUser ? (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>{selectedUser.username}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.emailSection}>
            <Text style={styles.emailTitle}>User <Text style={styles.textRed}>not</Text> on PinQuo?</Text>
            <Text style={styles.emailSubtitle}>Quote email to send invitation</Text>
            <TextInput
              style={styles.input}
              value={inviteEmail}
              onChangeText={(text) => {
                setInviteEmail(text);
                setSearchTerm('');
                setSelectedUser(null);
              }}
              placeholder="example@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity 
            style={[styles.continueBtn, isButtonDisabled && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={isButtonDisabled}
          >
            <Text style={[styles.continueBtnText, isButtonDisabled && styles.continueBtnTextDisabled]}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  flex1: { flex: 1, padding: 24 },
  header: { alignItems: 'center', marginBottom: 32, position: 'relative' },
  backBtn: { position: 'absolute', left: 0, top: 0, padding: 8, zIndex: 10 },
  title: { fontSize: 32, fontWeight: '900', color: '#000' },
  subtitle: { fontSize: 18, fontWeight: '700', color: '#64748b', marginTop: 4 },
  content: { flex: 1, alignItems: 'center' },
  questionText: { fontSize: 24, fontWeight: '700', color: '#334155', marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '700', color: '#64748b', marginBottom: 8 },
  input: { w: '100%', width: '100%', backgroundColor: '#f1f5f9', borderRadius: 32, paddingVertical: 16, paddingHorizontal: 24, fontSize: 18, fontWeight: '700', textAlign: 'center', color: '#0f172a' },
  resultsContainer: { minHeight: 120, width: '100%', alignItems: 'center', marginTop: 12 },
  resultItem: { width: '80%', padding: 16, backgroundColor: '#f1f5f9', borderRadius: 24, marginBottom: 8, alignItems: 'center' },
  resultText: { fontSize: 16, fontWeight: '700', color: '#334155' },
  selectedBadge: { backgroundColor: '#bbf7d0', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, borderWidth: 3, borderColor: '#86efac' },
  selectedBadgeText: { fontSize: 18, fontWeight: '900', color: '#022c22' },
  emailSection: { width: '100%', alignItems: 'center', marginTop: 'auto', marginBottom: 32 },
  emailTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  textRed: { color: '#ef4444' },
  emailSubtitle: { fontSize: 16, fontWeight: '700', color: '#64748b', marginBottom: 16 },
  continueBtn: { width: '100%', backgroundColor: '#bbf7d0', paddingVertical: 20, borderRadius: 40, alignItems: 'center', borderWidth: 4, borderColor: '#a7f3d0' },
  continueBtnDisabled: { opacity: 0.5 },
  continueBtnText: { fontSize: 24, fontWeight: '900', color: '#022c22' },
  continueBtnTextDisabled: { color: '#064e3b' }
});