import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Modal, 
  FlatList, ActivityIndicator, Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, CheckCheck, MessageCircle, Heart, UserPlus, Quote } from 'lucide-react-native';
import { supabase } from '../services/supabase';

interface NotificationUser {
  id: string;
  username: string;
  avatar_url: string;
}

interface Notification {
  id: string;
  type: 'quote' | 'comment' | 'reaction' | 'follow';
  is_read: boolean;
  created_at: string;
  quote_id: string | null;
  actor: NotificationUser;
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          is_read,
          created_at,
          quote_id,
          actor:profiles!notifications_actor_id_fkey(id, username, avatar_url)
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data) {
        const formatted = data.map((n: any) => ({
          ...n,
          actor: Array.isArray(n.actor) ? n.actor[0] : n.actor
        })) as Notification[];

        setNotifications(formatted);
        setUnreadCount(formatted.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Fetch when component mounts
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleOpenDropdown = () => {
    setIsOpen(true);
    fetchNotifications();
  };

  const handleCloseDropdown = () => {
    setIsOpen(false);
  };

  const markAllAsRead = async () => {
    if (!currentUserId || unreadCount === 0) return;
    setIsLoading(true);
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('receiver_id', currentUserId)
        .eq('is_read', false);
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark this specific notification as read if it isn't already
    if (!notification.is_read) {
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
    }

    // Close modal and Navigate based on type
    setIsOpen(false);
    
    if (notification.type === 'follow') {
      console.log('Navigate to user:', notification.actor.id);
    } else if (notification.quote_id) {
      console.log('Navigate to quote:', notification.quote_id);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'quote': return <Quote size={16} color="#3b82f6" />;
      case 'comment': return <MessageCircle size={16} color="#10b981" />;
      case 'reaction': return <Heart size={16} color="#ef4444" />;
      case 'follow': return <UserPlus size={16} color="#8b5cf6" />;
      default: return <Bell size={16} color="#64748b" />;
    }
  };

  const getTextForType = (actorName: string, type: string) => {
    switch (type) {
      case 'quote': return `${actorName} quoted you.`;
      case 'comment': return `${actorName} commented on your quote.`;
      case 'reaction': return `${actorName} reacted to your quote.`;
      case 'follow': return `${actorName} started following you.`;
      default: return `${actorName} interacted with you.`;
    }
  };

  return (
    <>
      <TouchableOpacity onPress={handleOpenDropdown} style={styles.bellContainer}>
        <Bell size={24} color="#0f172a" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseDropdown}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleCloseDropdown}>
          <TouchableOpacity style={styles.dropdownContainer} activeOpacity={1}>
            
            <View style={styles.dropdownHeader}>
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead} disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#0f172a" />
                  ) : (
                    <View style={styles.markReadBtn}>
                      <CheckCheck size={16} color="#0f172a" />
                      <Text style={styles.markReadText}>Mark all read</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              style={styles.list}
              ListEmptyComponent={
                <Text style={styles.emptyText}>You have no notifications yet.</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.notificationItem, !item.is_read && styles.unreadItem]}
                  onPress={() => handleNotificationPress(item)}
                >
                  <View style={styles.avatarContainer}>
                    {item.actor.avatar_url ? (
                      <Image source={{ uri: item.actor.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={styles.placeholderAvatar}>
                        <Text style={styles.placeholderText}>
                          {item.actor.username?.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.iconBadge}>
                      {getIconForType(item.type)}
                    </View>
                  </View>
                  
                  <View style={styles.textContainer}>
                    <Text style={[styles.notificationText, !item.is_read && styles.boldText]}>
                      {getTextForType(item.actor.username, item.type)}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellContainer: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 16,
  },
  dropdownContainer: {
    backgroundColor: '#ffffff',
    width: 320,
    maxHeight: 400,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  list: {
    maxHeight: 340,
  },
  emptyText: {
    padding: 24,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  unreadItem: {
    backgroundColor: '#f0f9ff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
    color: '#0f172a',
  }
});