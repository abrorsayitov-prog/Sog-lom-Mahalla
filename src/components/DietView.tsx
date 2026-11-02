import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { STANDARD_DIETS, type Diet, type Lang } from "@/lib/diets";
import type { CustomDiet, DietPayload } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export type DietContent = {
  number: number;
  title: string;
  purpose: string;
  indications: string[];
  rules: string[];
  allowed: string[];
  limited: string[];
  forbidden: string[];
  menu: string[];
  custom: boolean;
};

export function standardContent(diet: Diet, lang: Lang): DietContent {
  return {
    number: diet.number,
    title: diet.title[lang],
    purpose: diet.purpose[lang],
    indications: diet.indications[lang],
    rules: diet.rules[lang],
    allowed: diet.allowed[lang],
    limited: diet.limited[lang],
    forbidden: diet.forbidden[lang],
    menu: diet.sampleMenu[lang],
    custom: false,
  };
}

export function customContent(diet: CustomDiet, lang: Lang): DietContent {
  const payload: DietPayload = diet.payload;
  const list = (values: string[] | undefined) => (values ?? []).filter(Boolean);
  return {
    number: diet.number,
    title: payload.title,
    purpose: payload.purpose,
    indications: list(payload.indications),
    rules: [],
    allowed: list(payload.allowed),
    limited: list(payload.limited),
    forbidden: list(payload.forbidden),
    menu: list(payload.menu),
    custom: true,
  };
}

function Section({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "allowed" | "limited" | "forbidden" | "info";
}) {
  if (items.length === 0) return null;
  const tones = {
    allowed: "border-success/40 bg-success-soft",
    limited: "border-warning/40 bg-warning-soft",
    forbidden: "border-destructive/40 bg-danger-soft",
    info: "border-border bg-muted",
  };
  const heads = {
    allowed: "text-success",
    limited: "text-warning",
    forbidden: "text-destructive",
    info: "text-foreground",
  };
  return (
    <div className={`rounded-2xl border-2 p-4 ${tones[tone]}`}>
      <h4 className={`text-lg font-extrabold ${heads[tone]}`}>{label}</h4>
      <ul className="mt-2 space-y-1.5 text-lg leading-snug">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden="true">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Bittasi ochiladigan parhez kartasi: 1–15 stol yoki shifokor parhezi. */
export function DietCard({
  content,
  open = false,
  onToggle,
}: {
  content: DietContent;
  open?: boolean;
  onToggle?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="card-soft overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand text-xl font-extrabold text-primary-foreground">
          {content.number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xl font-bold leading-tight">{content.title}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {content.custom ? t("diet.customTag") : t("diet.standardTag")}
          </span>
        </span>
        {onToggle && (
          <ChevronDown
            className={`h-6 w-6 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {open && (
        <div className="space-y-3 border-t p-4">
          <p className="text-lg leading-snug">{content.purpose}</p>
          <Section label={t("diet.indications")} items={content.indications} tone="info" />
          <Section label={t("diet.rules")} items={content.rules} tone="info" />
          <Section label={t("diet.allowed")} items={content.allowed} tone="allowed" />
          <Section label={t("diet.limited")} items={content.limited} tone="limited" />
          <Section label={t("diet.forbidden")} items={content.forbidden} tone="forbidden" />
          <Section label={t("diet.menu")} items={content.menu} tone="info" />
        </div>
      )}
    </div>
  );
}

/** 1–15 tayyor stollar ro'yxati — bittasi tanlanadi yoki ochib ko'riladi. */
export function StandardDietList({
  selected,
  onPick,
}: {
  selected?: number | null;
  onPick?: (number: number) => void;
}) {
  const { lang, t } = useI18n();
  const [openNumber, setOpenNumber] = useState<number | null>(selected ?? null);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {STANDARD_DIETS.map((d) => (
          <button
            key={d.number}
            type="button"
            aria-pressed={selected === d.number}
            onClick={() => {
              setOpenNumber(d.number);
              onPick?.(d.number);
            }}
            className={`h-12 min-w-12 rounded-xl px-3 text-lg font-extrabold transition ${
              selected === d.number
                ? "bg-primary text-primary-foreground"
                : openNumber === d.number
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
            title={d.title[lang]}
          >
            {d.number}
          </button>
        ))}
      </div>
      {onPick && <p className="text-base text-muted-foreground">{t("diet.choose")}</p>}
      {STANDARD_DIETS.filter((d) => d.number === openNumber).map((d) => (
        <DietCard
          key={d.number}
          content={standardContent(d, lang)}
          open
          onToggle={() => setOpenNumber(null)}
        />
      ))}
    </div>
  );
}
