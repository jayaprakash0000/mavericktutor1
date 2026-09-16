import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, loadSettings, type Settings } from "@/lib/settings";

export function useSettings(): Settings {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => {
    setSettings(loadSettings());
    const handler = () => setSettings(loadSettings());
    window.addEventListener("settings:updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("settings:updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return settings;
}
