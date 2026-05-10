import en from "../locales/en.json" with { type: "json" };
import ar from "../locales/ar.json" with { type: "json" };
import fr from "../locales/fr.json" with { type: "json" };

const translations = { en, ar, fr };

const state = {
  language: "en",
  isRTL: false,
  dir: "ltr",
  listeners: [],
};

const loadSavedLanguage = () => {
  try {
    const saved = localStorage.getItem("zynmart_language");
    if (saved && translations[saved]) {
      state.language = saved;
    } else {
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "ar") state.language = "ar";
      else if (browserLang === "fr") state.language = "fr";
    }
  } catch {}
  updateDir();
};

const updateDir = () => {
  state.isRTL = state.language === "ar";
  state.dir = state.isRTL ? "rtl" : "ltr";
  document.documentElement.dir = state.dir;
  document.documentElement.lang = state.language;
};

export const getLanguage = () => state.language;
export const getDir = () => state.dir;
export const isRTL = () => state.isRTL;

export const setLanguage = (lang) => {
  if (!translations[lang]) return;
  state.language = lang;
  localStorage.setItem("zynmart_language", lang);
  updateDir();
  state.listeners.forEach((fn) => fn());
};

export const t = (key, params) => {
  let text = translations[state.language]?.[key] || translations["en"]?.[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    });
  }
  return text;
};

export const onLanguageChange = (fn) => {
  state.listeners.push(fn);
  return () => {
    state.listeners = state.listeners.filter((l) => l !== fn);
  };
};

loadSavedLanguage();
