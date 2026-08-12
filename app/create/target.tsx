import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, User, Mail, UserPlus } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { useCreateQuoteStore } from '../../store/useCreateQuoteStore';

type SearchProfile = { id: string; username: string };

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function TargetScreen() {
  const router = useRouter();
  const { setTargetAsUser, setTargetAsEmail, setTargetAsCustom } = useCreateQuoteStore();
  
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<SearchProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let active = true;
    const searchUsers = async () => {
      if (inputValue.trim().length < 2 || isValidEmail(inputValue)) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${inputValue.replace('@', '')}%`)
        .limit(5);

      if (active && data && !error) setResults(data as SearchProfile[]);
      if (active) setIsSearching(false);
    };

    const delayDebounceFn = setTimeout(() => searchUsers(), 300);
    return () => { active = false; clearTimeout(delayDebounceFn); };
  }, [inputValue]);

  const handleSelectUser = (user: SearchProfile) => {
    setTargetAsUser(user.id, user.username);
    router.push('/create/preview');
  };

  const handleInviteEmail = () => {
    if (!isValidEmail(inputValue)) return;
    setTargetAsEmail(inputValue.trim().toLowerCase());
    router.push('/create/preview');
  };

  const handleCustomName = () => {
    if (!inputValue.trim()) return;
    setTargetAsCustom(inputValue.trim());
    router.push('/create/preview');
  };

  const isEmail = isValidEmail(inputValue);
  const showCustomOption = inputValue.trim().length > 0 && !isEmail && results.length === 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Who said it?</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Search size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Username, email, or custom name..."
            placeholderTextColor="#94a3b8"
            value={inputValue}
            onChangeText={setInputValue}
            autoFocus
            autoCapitalize="none"
          />
        </View>

        <View style={styles.resultsContainer}>
          {/* 1. Databas-användare */}
          {results.map((item) => (
            <TouchableOpacity key={item.id} style={styles.resultRow} onPress={() => handleSelectUser(item)}>
              <View style={styles.avatarPlaceholder}><User size={20} color="#64748b" /></View>
              <View>
                <Text style={styles.resultTitle}>{item.username}</Text>
                <Text style={styles.resultSubtitle}>PinQuote User</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* 2. E-postinbjudan */}
          {isEmail && (
            <TouchableOpacity style={styles.resultRow} onPress={handleInviteEmail}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: '#dcfce3' }]}>
                <Mail size={20} color="#166534" />
              </View>
              <View>
                <Text style={styles.resultTitle}>Invite to PinQuote</Text>
                <Text style={styles.resultSubtitle}>Send quote to {inputValue}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* 3. Custom Name (Fallback) */}
          {showCustomOption && (
            <TouchableOpacity style={styles.resultRow} onPress={handleCustomName}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: '#f1f5f9' }]}>
                <UserPlus size={20} color="#475569" />
              </View>
              <View>
                <Text style={styles.resultTitle}>Use "{inputValue}"</Text>
                <Text style={styles.resultSubtitle}>Publish without notifications</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  iconButton: { padding: 8 },
  content: { padding: 24, flex: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 20, height: 60, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  searchIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  resultsContainer: { marginTop: 24 },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  resultTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  resultSubtitle: { fontSize: 13, fontWeight: '600', color: '#64748b' },
});