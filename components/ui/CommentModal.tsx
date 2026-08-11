// components/ui/CommentModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { X, Send } from 'lucide-react-native';
import { FeedQuote } from '../../types/feed';
import { supabase } from '../../services/supabase';

interface CommentModalProps {
  quote: FeedQuote | null;
  isVisible: boolean;
  onClose: () => void;
  currentUserId: string | null;
}

export const CommentModal = ({ quote, isVisible, onClose, currentUserId }: CommentModalProps) => {
  const [commentText, setCommentText] = useState('');
  
  // Här skulle du flytta in logiken för att hämta kommentarer från din Next.js useEffect
  // const [comments, setComments] = useState([]);
  // useEffect(() => { if (quote) fetchComments() }, [quote]);

  if (!quote) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheet}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#334155" />
            </TouchableOpacity>
          </View>

          {/* Här skulle du rendera kommentarerna med en FlatList */}
          <View style={styles.contentArea}>
             <Text style={styles.emptyText}>Comments list goes here...</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input}
              placeholder="Write a comment..."
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity style={styles.sendBtn}>
              <Send size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#f8fafc', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  closeBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 },
  contentArea: { flex: 1, padding: 20 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingBottom: 32 }, // paddingBottom för iOS hem-indikator
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, fontSize: 16, marginRight: 12 },
  sendBtn: { backgroundColor: '#000', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }
});