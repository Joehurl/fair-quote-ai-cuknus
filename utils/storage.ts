import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedQuote {
  id: string;
  description: string;
  amount: number;
  location: string;
  details: string;
  verdict: 'fair' | 'overpriced' | 'underpriced' | 'uncertain';
  confidence: number;
  explanation: string;
  tips: string[];
  estimatedLow: number;
  estimatedHigh: number;
  category: string;
  analyzedAt: string; // ISO date
}

const STORAGE_KEY = 'fairquote_history';

export async function loadQuotes(): Promise<SavedQuote[]> {
  console.log('[storage] Loading quotes from AsyncStorage');
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedQuote[];
    console.log('[storage] Loaded', parsed.length, 'quotes');
    return parsed;
  } catch (e) {
    console.error('[storage] Failed to load quotes:', e);
    return [];
  }
}

export async function saveQuote(quote: SavedQuote): Promise<void> {
  console.log('[storage] Saving quote:', quote.id);
  try {
    const existing = await loadQuotes();
    const updated = [quote, ...existing];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log('[storage] Quote saved successfully');
  } catch (e) {
    console.error('[storage] Failed to save quote:', e);
    throw e;
  }
}

export async function deleteQuote(id: string): Promise<void> {
  console.log('[storage] Deleting quote:', id);
  try {
    const existing = await loadQuotes();
    const updated = existing.filter((q) => q.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log('[storage] Quote deleted successfully');
  } catch (e) {
    console.error('[storage] Failed to delete quote:', e);
    throw e;
  }
}

export async function clearAllQuotes(): Promise<void> {
  console.log('[storage] Clearing all quotes');
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('[storage] All quotes cleared');
  } catch (e) {
    console.error('[storage] Failed to clear quotes:', e);
    throw e;
  }
}
