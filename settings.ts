const KEY = "chatbot.settings.v1";

export type ChatMode = "ai" | "human";
export type Position = "bottom-right" | "bottom-left";
export type Theme = "light" | "dark" | "system";

export type Settings = {
  displayName: string;
  avatarDataUrl: string | null;
  primaryColor: string; // hex
  chatBackground: string; // hex
  position: Position;
  theme: Theme;
  welcomeMessage: string;
  triggerDelaySec: number;
  mode: ChatMode;
  pageTargeting: string;
  contactEmail: string;
  contactPhone: string;
  contactSocial: string;
};

export const DEFAULT_SETTINGS: Settings = {
  displayName: "Maverick Tutor",
  avatarDataUrl: null,
  primaryColor: "#7c5cff",
  chatBackground: "#fcfbff",
  position: "bottom-right",
  theme: "system",
  welcomeMessage:
    "Hi! Ask me anything about AI, ML, or science — in English, हिन्दी, or తెలుగు.",
  triggerDelaySec: 0,
  mode: "ai",
  pageTargeting: "",
  contactEmail: "",
  contactPhone: "",
  contactSocial: "",
};

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("settings:updated"));
}

export function applyThemeFromSettings(s: Settings) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--primary", s.primaryColor);
  document.documentElement.style.setProperty("--ring", s.primaryColor);
  document.documentElement.style.setProperty("--chat-background", s.chatBackground);
  const isDark =
    s.theme === "dark" ||
    (s.theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", !!isDark);
}

export function setTheme(theme: Theme) {
  const next = { ...loadSettings(), theme };
  saveSettings(next);
  applyThemeFromSettings(next);
}
