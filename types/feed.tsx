// types/feed.ts

export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface GroupedReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export interface TemplateConfig {
  style_config: {
    gradient: string;
    baseColor: string;
  };
}

export interface FeedQuote {
  id: string;
  content: string;
  created_at: string;
  quoted_email: string | null;
  custom_author_name: string | null;
  
  // Added these to fix the TypeScript mismatch
  template_id: string | null;
  live_photo_url?: string | null; 
  
  // Relational data from Supabase joins
  publisher: { 
    id: string; 
    username: string; 
  } | null;
  
  quoted_user: { 
    username: string; 
    avatar_url: string | null; 
  } | null;
  
  template: TemplateConfig | null;
  
  // Client-side processed states for the UI
  groupedReactions: GroupedReaction[];
  commentCount: number;
  favoriteCount: number;
  isFavorited: boolean;
}