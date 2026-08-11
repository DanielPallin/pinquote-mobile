// app/(tabs)/profile/index.tsx
import React from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  SafeAreaView, ScrollView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, Bell, Edit3, Share, Crown, LayoutTemplate, Settings, Star 
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();

  // Mock-data - detta byts senare ut mot en hook (t.ex. useProfile)
  const user = {
    username: 'Username1',
    bio: 'Mostly quotes from my clown family',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    following: 154,
    followers: 98,
    isPro: true
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>PinQuo</Text>
          <Text style={styles.headerSubtitle}>Profile</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Bell size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* USER INFO SECTION */}
        <View style={styles.userInfoSection}>
          {/* Avatar & Username */}
          <View style={styles.avatarColumn}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{user.username}</Text>
              <TouchableOpacity>
                <Edit3 size={16} color="#64748b" style={styles.editIcon} />
              </TouchableOpacity>
            </View>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              <TouchableOpacity style={styles.shareBtn}>
                <Share size={16} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bio */}
          <View style={styles.bioColumn}>
            <View style={styles.bioHeader}>
              <Text style={styles.bioLabel}>Bio</Text>
              <TouchableOpacity>
                <Edit3 size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.bioBox}>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          </View>
        </View>

        {/* QUOTE GRIDS NAVIGATION */}
        <View style={styles.gridsSection}>
          <TouchableOpacity 
            style={styles.gridBtn}
            onPress={() => router.push('/profile/published')}
          >
            <Text style={styles.gridLabel}>Published Quotes</Text>
            <View style={styles.gridBox}>
               {/* Enkel illustration av ett rutnät */}
               <View style={styles.gridRow}>
                 <View style={styles.gridCell} /><View style={styles.gridCell} />
               </View>
               <View style={styles.gridRow}>
                 <View style={styles.gridCell} /><View style={styles.gridCell} />
               </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridBtn}
            onPress={() => router.push('/profile/quoted-in')}
          >
            <Text style={styles.gridLabel}>Quoted In</Text>
            <View style={styles.gridBox}>
               <View style={styles.gridRow}>
                 <View style={styles.gridCell} /><View style={styles.gridCell} />
               </View>
               <View style={styles.gridRow}>
                 <View style={styles.gridCell} /><View style={styles.gridCell} />
               </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* BOTTOM SECTION: STATS & SETTINGS */}
        <View style={styles.bottomSection}>
          
          {/* Stats Column */}
          <View style={styles.statsColumn}>
            <TouchableOpacity style={styles.statPill}>
              <Text style={styles.statPillText}>Following</Text>
              <Text style={styles.statPillNumber}>{user.following}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statPill}>
              <Text style={styles.statPillText}>Followers</Text>
              <Text style={styles.statPillNumber}>{user.followers}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statPill}>
              <Text style={styles.statPillText}>Favourites</Text>
              <Star size={20} color="#000" fill="#facc15" style={{ marginTop: 4 }} />
            </TouchableOpacity>
          </View>

          {/* Settings List */}
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingsItem}>
              <Crown size={20} color="#eab308" />
              <Text style={styles.settingsText}>PinQuo Pro</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem}>
              <LayoutTemplate size={20} color="#94a3b8" />
              <Text style={styles.settingsText}>Templates</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingsItem}
              onPress={() => router.push('/profile/settings')}
            >
              <Settings size={20} color="#64748b" />
              <Text style={styles.settingsText}>Account settings</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#f8fafc' },
  iconButton: { padding: 8 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  headerSubtitle: { fontSize: 14, fontWeight: '600', color: '#64748b' },

  // User Info
  userInfoSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, gap: 16 },
  avatarColumn: { alignItems: 'center', flex: 1 },
  usernameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  username: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  editIcon: { marginLeft: 6 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#cbd5e1' },
  shareBtn: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#fff', padding: 8, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  
  bioColumn: { flex: 1.2 },
  bioHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  bioLabel: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  bioBox: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 16, minHeight: 80 },
  bioText: { fontSize: 14, color: '#475569', lineHeight: 20, fontWeight: '500' },

  // Grids
  gridsSection: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 40 },
  gridBtn: { flex: 1, alignItems: 'center' },
  gridLabel: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  gridBox: { width: '100%', aspectRatio: 1, backgroundColor: '#f1f5f9', borderRadius: 24, padding: 8, borderWidth: 4, borderColor: '#bbf7d0' },
  gridRow: { flex: 1, flexDirection: 'row', gap: 8, marginBottom: 8 },
  gridCell: { flex: 1, backgroundColor: '#e2e8f0', borderRadius: 12 },

  // Bottom Section
  bottomSection: { flexDirection: 'row', justifyContent: 'space-between', gap: 24 },
  statsColumn: { flex: 1, gap: 16 },
  statPill: { backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 24, alignItems: 'center' },
  statPillText: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 4 },
  statPillNumber: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
  
  settingsList: { flex: 1.5, gap: 24, justifyContent: 'center' },
  settingsItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155' },
  chevron: { fontSize: 20, color: '#94a3b8', fontWeight: '500' }
});