/**
 * Credits storage for FairQuote AI consumable purchases.
 * Tracks remaining single-analysis credits in AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const CREDITS_KEY = 'fairquote_credits';

export async function getCredits(): Promise<number> {
  console.log('[credits] Loading credits from AsyncStorage');
  try {
    const raw = await AsyncStorage.getItem(CREDITS_KEY);
    if (raw === null) return 0;
    const parsed = parseInt(raw, 10);
    const credits = isNaN(parsed) ? 0 : parsed;
    console.log('[credits] Current credits:', credits);
    return credits;
  } catch (e) {
    console.error('[credits] Failed to load credits:', e);
    return 0;
  }
}

export async function addCredits(count: number): Promise<number> {
  console.log('[credits] Adding credits:', count);
  try {
    const current = await getCredits();
    const updated = current + count;
    await AsyncStorage.setItem(CREDITS_KEY, String(updated));
    console.log('[credits] Credits updated to:', updated);
    return updated;
  } catch (e) {
    console.error('[credits] Failed to add credits:', e);
    throw e;
  }
}

export async function deductCredit(): Promise<number> {
  console.log('[credits] Deducting 1 credit');
  try {
    const current = await getCredits();
    if (current <= 0) {
      console.log('[credits] No credits to deduct');
      return 0;
    }
    const updated = current - 1;
    await AsyncStorage.setItem(CREDITS_KEY, String(updated));
    console.log('[credits] Credits remaining:', updated);
    return updated;
  } catch (e) {
    console.error('[credits] Failed to deduct credit:', e);
    throw e;
  }
}

export async function setCredits(count: number): Promise<void> {
  console.log('[credits] Setting credits to:', count);
  try {
    await AsyncStorage.setItem(CREDITS_KEY, String(count));
  } catch (e) {
    console.error('[credits] Failed to set credits:', e);
    throw e;
  }
}
