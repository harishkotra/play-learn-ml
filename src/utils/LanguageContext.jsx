import { createContext, useContext, useState } from "react";
import { t } from "./i18n";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    const saved = localStorage.getItem("play-learn-ml-locale");
    return saved || "en";
  });

  const changeLocale = (code) => {
    setLocale(code);
    localStorage.setItem("play-learn-ml-locale", code);
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale: changeLocale,
        t: (key, ...args) => t(key, locale, ...args),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
