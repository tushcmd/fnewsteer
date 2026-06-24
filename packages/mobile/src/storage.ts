import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  BASE_URL: '@fnewsteer/base_url',
  API_KEY: '@fnewsteer/api_key',
  PAIR: '@fnewsteer/pair',
};

export async function loadSettings(): Promise<{ baseUrl: string; apiKey: string; pair: string }> {
  const [baseUrl, apiKey, pair] = await Promise.all([
    AsyncStorage.getItem(KEYS.BASE_URL),
    AsyncStorage.getItem(KEYS.API_KEY),
    AsyncStorage.getItem(KEYS.PAIR),
  ]);
  return {
    baseUrl: baseUrl || 'https://fnewsteer-api.onrender.com',
    apiKey: apiKey || '',
    pair: pair || 'EURUSD',
  };
}

export async function saveSettings(settings: { baseUrl?: string; apiKey?: string; pair?: string }) {
  const ops: Promise<void>[] = [];
  if (settings.baseUrl !== undefined) ops.push(AsyncStorage.setItem(KEYS.BASE_URL, settings.baseUrl));
  if (settings.apiKey !== undefined) ops.push(AsyncStorage.setItem(KEYS.API_KEY, settings.apiKey));
  if (settings.pair !== undefined) ops.push(AsyncStorage.setItem(KEYS.PAIR, settings.pair));
  await Promise.all(ops);
}
