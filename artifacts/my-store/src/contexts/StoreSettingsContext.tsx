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
    if (!settings) return;

    // 1. تطبيق القالب الفني (Theme)
    if (settings.activeTheme) {
      document.documentElement.setAttribute("data-theme", settings.activeTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "classic");
    }

    // 2. تطبيق ألوان الـ Hero كمتغيرات CSS (اختياري لسهولة الاستخدام في الكود)
    if ((settings as any).heroPrimaryColor) {
      document.documentElement.style.setProperty(
        "--hero-primary",
        (settings as any).heroPrimaryColor,
      );
    }
    if ((settings as any).heroTitleColor) {
      document.documentElement.style.setProperty(
        "--hero-title",
        (settings as any).heroTitleColor,
      );
    }
  }, [settings]);

  return null;
}

export function useTheme() {
  const { settings } = useStoreSettings();
  return settings?.activeTheme || "classic";
}
