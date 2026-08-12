import { create } from 'zustand';

export type QuoteTemplate = {
  id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  isPro: boolean;
};

type TargetType = 'user' | 'email' | 'custom' | null;

interface CreateQuoteState {
  // Media
  mediaType: 'template' | 'live_photo';
  template: QuoteTemplate | null;
  livePhotoUri: string | null;
  
  // Content
  quoteText: string;
  
  // Attribution (The Target)
  targetType: TargetType;
  targetId: string | null;
  targetUsername: string | null;
  targetEmail: string | null;
  customName: string | null;
  
  // Actions
  setMediaAsTemplate: (template: QuoteTemplate) => void;
  setMediaAsLivePhoto: (uri: string) => void;
  setQuoteText: (text: string) => void;
  setTargetAsUser: (id: string, username: string) => void;
  setTargetAsEmail: (email: string) => void;
  setTargetAsCustom: (name: string) => void;
  reset: () => void;
}

export const useCreateQuoteStore = create<CreateQuoteState>((set) => ({
  mediaType: 'template',
  template: null,
  livePhotoUri: null,
  
  quoteText: '',
  
  targetType: null,
  targetId: null,
  targetUsername: null,
  targetEmail: null,
  customName: null,
  
  setMediaAsTemplate: (template) => set({ mediaType: 'template', template, livePhotoUri: null }),
  setMediaAsLivePhoto: (uri) => set({ mediaType: 'live_photo', livePhotoUri: uri, template: null }),
  setQuoteText: (text) => set({ quoteText: text }),
  
  setTargetAsUser: (id, username) => set({ 
    targetType: 'user', targetId: id, targetUsername: username, targetEmail: null, customName: null 
  }),
  setTargetAsEmail: (email) => set({ 
    targetType: 'email', targetEmail: email, targetId: null, targetUsername: null, customName: null 
  }),
  setTargetAsCustom: (name) => set({ 
    targetType: 'custom', customName: name, targetId: null, targetUsername: null, targetEmail: null 
  }),
  
  reset: () => set({ 
    mediaType: 'template', template: null, livePhotoUri: null, quoteText: '', 
    targetType: null, targetId: null, targetUsername: null, targetEmail: null, customName: null 
  }),
}));