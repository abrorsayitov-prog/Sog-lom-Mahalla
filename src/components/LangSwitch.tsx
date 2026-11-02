import { Globe } from "lucide-react";
import { LANGUAGES, useI18n } from "@/lib/i18n";

export function LangSwitch({ dark = false }: { dark?: boolean }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("top.language")}
      className={`flex items-center gap-1 rounded-full p-1 ${dark ? "bg-sidebar-accent" : "bg-secondary"}`}
    >
      <Globe
        className={`ml-1.5 h-4 w-4 ${dark ? "text-nav-foreground" : "text-primary"}`}
        aria-hidden="true"
      />
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          aria-pressed={lang === l.code}
          title={l.native}
          onClick={() => setLang(l.code)}
          className={`h-9 min-w-9 rounded-full px-2.5 text-sm font-bold transition ${
            lang === l.code
              ? "bg-primary text-primary-foreground shadow"
              : dark
                ? "text-nav-foreground/75 hover:bg-nav-active/60"
                : "text-muted-foreground hover:bg-background"
          }`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
