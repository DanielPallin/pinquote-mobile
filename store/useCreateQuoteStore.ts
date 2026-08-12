// src/store/useCreateQuoteStore.ts
import { create } from 'zustand';

interface TargetUser {
  id?: string;
  username?: string;
  email?: string;
  customName?: string;
  avatarUrl?: string;
}

interface CreateQuoteState {
  // Steg 1: Vem citeras?
  target: TargetUser | null;
  setTarget: (target: TargetUser) => void;
  
  // Steg 2: Citatet och designen
  quoteText: string;
  setQuoteText: (text: string) => void;
  
  bgType: 'avatar' | 'template' | 'snap';
  setBgType: (type: 'avatar' | 'template' | 'snap') => void;
  
  selectedTemplate: { id: string; gradient: string } | null;
  setSelectedTemplate: (template: { id: string; gradient: string } | null) => void;

  // Rensar datan när publiceringen är klar
  resetFlow: () => void;
}

export const useCreateQuoteStore = create<CreateQuoteState>((set) => ({
  target: null,
  setTarget: (target) => set({ target }),
  
  quoteText: '',
  setQuoteText: (quoteText) => set({ quoteText }),
  
  bgType: 'template',
  setBgType: (bgType) => set({ bgType }),
  
  selectedTemplate: null,
  setSelectedTemplate: (selectedTemplate) => set({ selectedTemplate }),
  
  resetFlow: () => set({ 
    target: null, quoteText: '', bgType: 'template', selectedTemplate: null 
  }),
}));