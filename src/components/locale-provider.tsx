"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { UI_TEXT, type UiLocale } from "@/lib/ui-i18n";

type LocaleContextValue = { locale: UiLocale; setLocale: (locale: UiLocale) => void; t: (typeof UI_TEXT)[UiLocale] };
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<UiLocale>("en");

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const stored = window.localStorage.getItem("levellens-ui-locale");
    if (stored === "en" || stored === "es" || stored === "ja") {
      const handle = window.setTimeout(() => setLocaleState(stored), 0);
      return () => window.clearTimeout(handle);
    }
  }, []);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale(nextLocale) {
      window.localStorage.setItem("levellens-ui-locale", nextLocale);
      setLocaleState(nextLocale);
    },
    t: UI_TEXT[locale],
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}
