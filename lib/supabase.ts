import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, createBlankState } from './types';

const LOCAL_STORAGE_KEY = 'finanzapro_state_v1';
const SUPABASE_CONFIG_KEY = 'finanzapro_supabase_config_v1';
const USER_ROW_ID = 'default_user';

const DEFAULT_SUPABASE_URL = 'https://nsmgxjgekeqzlkkbvwwt.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'sb_publishable_VuQSqfkDUxmgatOR3gZw4Q_vo9YeOFX';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  if (typeof window === 'undefined') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
      anonKey:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
    };
  }
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SupabaseConfig;
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch {
    // ignore parse error
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    SUPABASE_CONFIG_KEY,
    JSON.stringify({
      url: config.url.trim(),
      anonKey: config.anonKey.trim(),
    })
  );
}

export function createDynamicSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }
  try {
    return createClient(url, anonKey);
  } catch {
    return null;
  }
}

export function loadLocalState(): AppState {
  if (typeof window === 'undefined') return createBlankState();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const blank = createBlankState();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(blank));
      return blank;
    }
    const parsed = JSON.parse(raw) as AppState;
    return applyDailyAutoAccrual(parsed);
  } catch {
    return createBlankState();
  }
}

export function saveLocalState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Calcula el auto-devengo diario de Trade Republic si han pasado días naturales
 * desde `lastInterestCalcDate`.
 */
export function applyDailyAutoAccrual(state: AppState): AppState {
  const todayStr = new Date().toISOString().split('T')[0];
  const lastStr = state.lastInterestCalcDate || todayStr;

  if (lastStr === todayStr) return state;

  const lastDate = new Date(`${lastStr}T00:00:00Z`);
  const currDate = new Date(`${todayStr}T00:00:00Z`);
  const diffMs = currDate.getTime() - lastDate.getTime();
  const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (daysElapsed <= 0) {
    return { ...state, lastInterestCalcDate: todayStr };
  }

  const trAccount =
    state.accounts.find((a) => a.isTradeRepublic) ||
    state.accounts.find((a) => a.name.toLowerCase().includes('trade republic'));

  const trBalance = trAccount ? Number(trAccount.balance || 0) : 0;
  const rate = Number(state.trInterestRate ?? 2.5);
  const dailyInterest = (trBalance * (rate / 100)) / 365;
  const addedInterest = daysElapsed * dailyInterest;

  return {
    ...state,
    trAccruedInterest: Number(
      (Number(state.trAccruedInterest || 0) + addedInterest).toFixed(4)
    ),
    lastInterestCalcDate: todayStr,
  };
}

export async function syncStateToCloud(state: AppState): Promise<boolean> {
  const client = createDynamicSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('user_state').upsert(
      {
        id: USER_ROW_ID,
        state_data: state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    return !error;
  } catch {
    return false;
  }
}

export async function fetchStateFromCloud(): Promise<{
  connected: boolean;
  cloudState: AppState | null;
}> {
  const client = createDynamicSupabaseClient();
  if (!client) return { connected: false, cloudState: null };

  try {
    const { data, error } = await client
      .from('user_state')
      .select('state_data, updated_at')
      .eq('id', USER_ROW_ID)
      .maybeSingle();

    if (error) {
      return { connected: false, cloudState: null };
    }

    if (data && data.state_data && Object.keys(data.state_data).length > 0) {
      const remoteState = data.state_data as AppState;
      if (Array.isArray(remoteState.accounts)) {
        return {
          connected: true,
          cloudState: applyDailyAutoAccrual(remoteState),
        };
      }
    }

    return { connected: true, cloudState: null };
  } catch {
    return { connected: false, cloudState: null };
  }
}
