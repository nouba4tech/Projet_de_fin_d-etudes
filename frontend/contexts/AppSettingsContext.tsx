import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AppSettings {
  hotelName: string;
  currency: string;
  checkInTime: string;
  checkOutTime: string;
  allowOverbooking: boolean;
  nightAuditAutoClose: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  XAF: 'FCFA',
  EUR: '€',
  USD: '$',
  GBP: '£',
  XOF: 'CFA',
  MAD: 'MAD',
};

const STORAGE_KEY = 'mirador-app-settings';

const defaultSettings: AppSettings = {
  hotelName: 'Hotel Mirador',
  currency: 'XAF',
  checkInTime: '14:00',
  checkOutTime: '12:00',
  allowOverbooking: false,
  nightAuditAutoClose: false,
};

const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {
    // ignore parse errors
  }
  return defaultSettings;
};

const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
};

interface AppSettingsContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  currencySymbol: string;
  formatAmount: (amount: number) => string;
}

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  const currencySymbol = CURRENCY_SYMBOLS[settings.currency] || settings.currency;

  const formatAmount = (amount: number): string => {
    const formatted = amount.toLocaleString('fr-FR');
    // For symbol-prefix currencies (€, $, £), put symbol before
    if (['EUR', 'USD', 'GBP'].includes(settings.currency)) {
      return `${currencySymbol}${formatted}`;
    }
    return `${formatted} ${currencySymbol}`;
  };

  return (
    <AppSettingsContext.Provider value={{ settings, updateSettings, currencySymbol, formatAmount }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = (): AppSettingsContextValue => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};
