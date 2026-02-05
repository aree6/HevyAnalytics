import { createStorageManager } from './createStorageManager';

// Type moved from dataSources/types.ts
export type DataSourceChoice = 'strong' | 'hevy' | 'lyfta' | 'other';

export type LoginMethod = 'csv' | 'credentials' | 'apiKey';

type LastLoginRecord = {
  method: LoginMethod;
  accountKey?: string;
};

type LastLoginMap = Partial<Record<DataSourceChoice, LastLoginRecord>>;

const validDataSources: DataSourceChoice[] = ['strong', 'hevy', 'lyfta', 'other'];
const validLoginMethods: LoginMethod[] = ['csv', 'credentials', 'apiKey'];

// Data Source Choice
const dataSourceStorage = createStorageManager<DataSourceChoice | null>({
  key: 'hevy_analytics_data_source',
  defaultValue: null,
  validator: (v) => validDataSources.includes(v as DataSourceChoice) ? (v as DataSourceChoice) : null,
});

export const saveDataSourceChoice = (choice: DataSourceChoice): void => dataSourceStorage.set(choice);
export const getDataSourceChoice = (): DataSourceChoice | null => dataSourceStorage.get();
export const clearDataSourceChoice = (): void => dataSourceStorage.clear();

// Hevy Auth Token
const hevyAuthTokenStorage = createStorageManager<string | null>({
  key: 'hevy_auth_token',
  defaultValue: null,
  validator: (v) => v,
});

export const saveHevyAuthToken = (token: string): void => hevyAuthTokenStorage.set(token);
export const getHevyAuthToken = (): string | null => hevyAuthTokenStorage.get();
export const clearHevyAuthToken = (): void => hevyAuthTokenStorage.clear();

// Hevy Pro API Key
const hevyProApiKeyStorage = createStorageManager<string | null>({
  key: 'hevy_pro_api_key',
  defaultValue: null,
  validator: (v) => v,
});

export const saveHevyProApiKey = (apiKey: string): void => hevyProApiKeyStorage.set(apiKey);
export const getHevyProApiKey = (): string | null => hevyProApiKeyStorage.get();
export const clearHevyProApiKey = (): void => hevyProApiKeyStorage.clear();

// Lyfta API Key
const lyftaApiKeyStorage = createStorageManager<string | null>({
  key: 'lyfta_api_key',
  defaultValue: null,
  validator: (v) => v,
});

export const saveLyfataApiKey = (apiKey: string): void => lyftaApiKeyStorage.set(apiKey);
export const getLyfataApiKey = (): string | null => lyftaApiKeyStorage.get();
export const clearLyfataApiKey = (): void => lyftaApiKeyStorage.clear();

// Last CSV Platform
const lastCsvPlatformStorage = createStorageManager<DataSourceChoice | null>({
  key: 'hevy_analytics_last_csv_platform',
  defaultValue: null,
  validator: (v) => validDataSources.includes(v as DataSourceChoice) ? (v as DataSourceChoice) : null,
});

export const saveLastCsvPlatform = (platform: DataSourceChoice): void => lastCsvPlatformStorage.set(platform);
export const getLastCsvPlatform = (): DataSourceChoice | null => lastCsvPlatformStorage.get();
export const clearLastCsvPlatform = (): void => lastCsvPlatformStorage.clear();

// Last Login Method (complex JSON structure)
const LAST_LOGIN_METHOD_KEY = 'hevy_analytics_last_login_method_v1';

const readLastLoginMap = (): LastLoginMap => {
  try {
    const raw = localStorage.getItem(LAST_LOGIN_METHOD_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as LastLoginMap;
  } catch {
    return {};
  }
};

const writeLastLoginMap = (map: LastLoginMap): void => {
  try {
    localStorage.setItem(LAST_LOGIN_METHOD_KEY, JSON.stringify(map));
  } catch {
    // Silent fail
  }
};

export const saveLastLoginMethod = (platform: DataSourceChoice, method: LoginMethod, accountKey?: string): void => {
  const map = readLastLoginMap();
  map[platform] = {
    method,
    accountKey: accountKey?.trim() ? accountKey.trim() : undefined,
  };
  writeLastLoginMap(map);
};

export const getLastLoginMethod = (platform: DataSourceChoice, accountKey?: string): LoginMethod | null => {
  const map = readLastLoginMap();
  const record = map[platform];
  if (!record) return null;

  // If we have an accountKey, prefer an exact match when the stored record includes one.
  if (accountKey?.trim() && record.accountKey && record.accountKey !== accountKey.trim()) return null;

  return validLoginMethods.includes(record.method) ? record.method : null;
};

export const clearLastLoginMethod = (): void => {
  try {
    localStorage.removeItem(LAST_LOGIN_METHOD_KEY);
  } catch {
    // Silent fail
  }
};

// Setup Complete
const setupCompleteStorage = createStorageManager<boolean>({
  key: 'hevy_analytics_setup_complete',
  defaultValue: false,
  serializer: (v) => (v ? '1' : '0'),
  deserializer: (v) => v === '1',
  validator: (v) => (v !== null ? v === '1' : null),
});

export const saveSetupComplete = (value: boolean): void => setupCompleteStorage.set(value);
export const getSetupComplete = (): boolean => setupCompleteStorage.get();
export const clearSetupComplete = (): void => setupCompleteStorage.clear();
