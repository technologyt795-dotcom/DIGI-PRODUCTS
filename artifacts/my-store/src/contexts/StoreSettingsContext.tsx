import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSettings,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import type { StoreSettings } from "@workspace/api-client-react";

interface StoreSettingsContextValue {
  settings: StoreSettings | null;
  isLoading: boolean;
  refreshSettings: () => void;
}

const StoreSettingsContext = createContext<
  StoreSettingsContextValue | undefined
>(undefined);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: settings = null, isLoading } = useGetSettings({
    query: {
      queryKey: getGetSettingsQueryKey(),
    },
  });

  const refreshSettings = () => {
    queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
  };

  return (
    <StoreSettingsContext.Provider
      value={{ settings, isLoading, refreshSettings }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);
  if (context === undefined) {
    throw new Error(
      "useStoreSettings must be used within a StoreSettingsProvider",
    );
  }
  return context;
}

export function ThemeApplier() {
  const { settings } = useStoreSettings();

  useEffect(() => {
    if (settings?.activeTheme) {
      document.documentElement.setAttribute("data-theme", settings.activeTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "classic"); // default
    }
  }, [settings?.activeTheme]);

  return null;
}

export function useTheme() {
  const { settings } = useStoreSettings();
  return settings?.activeTheme || "classic";
} // هذا هو القوس الذي كان ناقصاً ويسبب الخطأ
