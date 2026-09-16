import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Upload, X } from "lucide-react";
import {
  applyThemeFromSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type Settings,
} from "@/lib/settings";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Maverick Tutor" },
      { name: "description", content: "Customize appearance, behavior, and contact channels." },
    ],
  }),
  component: SettingsPage,
  ssr: false,
});

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="ml-2 text-xs text-muted-foreground">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/20 focus:ring-2";

function SettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setS(loadSettings());
  }, []);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    saveSettings(s);
    applyThemeFromSettings(s);
    toast.success("Settings saved");
  };

  const handleReset = () => {
    setS(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    applyThemeFromSettings(DEFAULT_SETTINGS);
    toast.success("Reset to defaults");
  };

  const handleAvatar = (file: File) => {
    if (file.size > 1_000_000) {
      toast.error("Image too large (max 1MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("avatarDataUrl", reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to chat
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Save changes
            </button>
          </div>
        </div>

        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Settings</h1>

        <div className="space-y-6">
          <Section title="Appearance & Customization" description="Colors, branding, avatar and position.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Display name">
                <input
                  className={inputCls}
                  value={s.displayName}
                  onChange={(e) => update("displayName", e.target.value)}
                  placeholder="e.g. Acme Support"
                />
              </Field>
              <Field label="Position" hint="(for floating widget mode)">
                <select
                  className={inputCls}
                  value={s.position}
                  onChange={(e) => update("position", e.target.value as Settings["position"])}
                >
                  <option value="bottom-right">Bottom right</option>
                  <option value="bottom-left">Bottom left</option>
                </select>
              </Field>
              <Field label="Theme">
                <select
                  className={inputCls}
                  value={s.theme}
                  onChange={(e) => update("theme", e.target.value as Settings["theme"])}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </Field>
              <Field label="Primary color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={s.primaryColor}
                    onChange={(e) => update("primaryColor", e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background"
                  />
                  <input
                    className={inputCls}
                    value={s.primaryColor}
                    onChange={(e) => update("primaryColor", e.target.value)}
                  />
                </div>
              </Field>
              <Field label="Chat background">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={s.chatBackground}
                    onChange={(e) => update("chatBackground", e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background"
                  />
                  <input
                    className={inputCls}
                    value={s.chatBackground}
                    onChange={(e) => update("chatBackground", e.target.value)}
                  />
                </div>
              </Field>
            </div>

            <Field label="Avatar">
              <div className="flex items-center gap-4">
                {s.avatarDataUrl ? (
                  <div className="relative">
                    <img src={s.avatarDataUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
                    <button
                      onClick={() => update("avatarDataUrl", null)}
                      className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                      aria-label="Remove avatar"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                    None
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAvatar(f);
                  }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
                >
                  <Upload className="h-4 w-4" /> Upload image
                </button>
              </div>
            </Field>
          </Section>

          <Section title="Behavior & Interactions" description="Welcome message and trigger conditions.">
            <Field label="Welcome message">
              <textarea
                className={inputCls + " min-h-[80px] resize-y"}
                value={s.welcomeMessage}
                onChange={(e) => update("welcomeMessage", e.target.value)}
              />
            </Field>
            <Field label="Trigger delay (seconds)" hint="Auto-open after N seconds in widget mode">
              <input
                type="number"
                min={0}
                className={inputCls}
                value={s.triggerDelaySec}
                onChange={(e) => update("triggerDelaySec", Number(e.target.value) || 0)}
              />
            </Field>
          </Section>

          <Section title="Functionality & Support" description="AI vs. human routing and page targeting.">
            <Field label="Mode">
              <div className="grid grid-cols-2 gap-2">
                {(["ai", "human"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => update("mode", m)}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                      s.mode === m
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {m === "ai" ? "AI Assistant (24/7)" : "Human Live Chat"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Page targeting" hint="Comma-separated URL paths; empty = all pages">
              <input
                className={inputCls}
                value={s.pageTargeting}
                onChange={(e) => update("pageTargeting", e.target.value)}
                placeholder="/pricing, /checkout"
              />
            </Field>
          </Section>

          <Section title="Contact Channels" description="Alternative ways for visitors to reach you.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Email">
                <input
                  type="email"
                  className={inputCls}
                  value={s.contactEmail}
                  onChange={(e) => update("contactEmail", e.target.value)}
                  placeholder="hello@example.com"
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputCls}
                  value={s.contactPhone}
                  onChange={(e) => update("contactPhone", e.target.value)}
                  placeholder="+1 555 010 1234"
                />
              </Field>
              <Field label="Social link">
                <input
                  className={inputCls}
                  value={s.contactSocial}
                  onChange={(e) => update("contactSocial", e.target.value)}
                  placeholder="https://twitter.com/acme"
                />
              </Field>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
