import { QuoteTemplate } from '../store/useCreateQuoteStore';

export const TEMPLATES: QuoteTemplate[] = [
  { id: '1', name: 'Hilarious', backgroundColor: '#fef08a', textColor: '#854d0e', isPro: false },
  { id: '2', name: 'Awkward', backgroundColor: '#fbcfe8', textColor: '#831843', isPro: false },
  { id: '3', name: 'Dark Mode', backgroundColor: '#1e293b', textColor: '#f8fafc', isPro: false },
  { id: '4', name: 'Sad Violin', backgroundColor: '#bae6fd', textColor: '#0c4a6e', isPro: false },
  { id: '5', name: 'Doge Classic', backgroundColor: '#fed7aa', textColor: '#9a3412', isPro: true },
  { id: '6', name: 'Galaxy Brain', backgroundColor: '#c084fc', textColor: '#3b0764', isPro: true },
];