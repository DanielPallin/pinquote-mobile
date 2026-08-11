// components/ui/SearchBar.tsx
import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, X } from 'lucide-react-native'; // Använd lucide-react-native för ikoner

interface SearchBarProps {
  searchQuery: string;
  isSearching: boolean;
  onSearchChange: (text: string) => void;
  onClear: () => void;
}

export const SearchBar = ({ 
  searchQuery, 
  isSearching, 
  onSearchChange, 
  onClear 
}: SearchBarProps) => {
  return (
    <View style={styles.container}>
      <Search size={20} color="#94a3b8" style={styles.icon} />
      <TextInput
        style={styles.input}
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder="Search users..."
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {isSearching ? (
        <ActivityIndicator size="small" color="#94a3b8" />
      ) : searchQuery.length > 0 ? (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <X size={16} color="#94a3b8" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  }
});