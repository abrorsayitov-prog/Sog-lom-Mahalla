import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, type LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";
import { AccountButton, displayName, ROLE_PATH } from "@/components/auth";
import { LangSwitch } from "@/components/LangSwitch";
import { errorMessage, useI18n } from "@/lib/i18n";
import { useLogout, useMe } from "@/lib/session";
import type { Role } from "@/lib/api";
import { Button } from "@/components/ui/button";

export { Link };

export function Logo({ light, size = "md" }: { light?: boolean; size?: "sm" | "md" | "lg" }) {
  const grad = `heart-${useId().replace(/:/g, "")}`;
  return (
    <div className={`logo logo-${size} flex items-center gap-2.5`}>
      <svg className="logo-mark" viewBox="0 0 48 44" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <path
          d="M24 39.5C24 39.5 3.5 26 3.5 14.8C3.5 8.5 8.4 3.5 14.6 3.5C18.6 3.5 22.2 5.7 24 9.2C25.8 5.7 29.4 3.5 33.4 3.5C39.6 3.5 44.5 8.5 44.5 14.8C44.5 26 24 39.5 24 39.5Z"
          fill={`url(#${grad})`}
        />
        <path
          d="M10.5 20h6l2.6-6.4 5.6 12.4 2.4-6H37.5"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`logo-name text-xl font-extrabold tracking-tight ${light ? "text-primary-foreground" : "text-foreground"}`}
      >
        Sog‘lom Mahalla
      </span>
    </div>
  );
}

export type NavItem = { key: string; label: string; icon: LucideIcon; badge?: number };

/** Tepadagi panel: chapda logotip, o'ngda globus (til) va odamcha (kirish / profil). */
export function TopBar({ role }: { role: Role }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3 md:px-8">
      <div className="md:hidden">
        <Logo size="sm" />
      </div>
      <div className="hidden text-lg font-bold md:block">Sog‘lom Mahalla</div>
      <div className="flex items-center gap-2">
        <LangSwitch />
        <AccountButton role={role} />
      </div>
    </div>
  );
}

export function Shell({
  role,
  nav,
  active,
  onNav,
  children,
}: {
  role: "admin" | "doctor";
  nav: NavItem[];
  active: string;
  onNav: (k: string) => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const me = useMe();
  const logout = useLogout();
  const signOut = () =>
    logout.mutate(undefined, {
      onSuccess: () => navigate({ to: ROLE_PATH[role], replace: true }),
    });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-nav p-5 text-nav-foreground lg:flex">
        <Logo light />
        {me.data && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-sidebar-accent p-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-lg font-bold text-primary-foreground">
              {displayName(me.data).charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-primary-foreground">
                {displayName(me.data)}
              </div>
              <div className="text-sm opacity-80">{t(`role.${role}`)}</div>
            </div>
          </div>
        )}
        <nav className="mt-6 flex flex-1 flex-col gap-1.5">
          {nav.map((n) => (
            <button
              key={n.key}
              onClick={() => onNav(n.key)}
              aria-current={active === n.key ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-base font-semibold transition ${
                active === n.key
                  ? "bg-nav-active text-primary-foreground"
                  : "hover:bg-sidebar-accent"
              }`}
            >
              <n.icon className="h-5 w-5" />
              <span className="flex-1 text-left">{n.label}</span>
              {!!n.badge && (
                <span className="rounded-full bg-destructive px-2.5 py-0.5 text-sm font-bold text-destructive-foreground">
                  {n.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button
          onClick={signOut}
          className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-base font-semibold hover:bg-sidebar-accent"
        >
          <LogOut className="h-5 w-5" /> {t("top.logout")}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar role={role} />
        <div className="flex gap-2 overflow-x-auto border-b bg-card px-4 py-2 lg:hidden">
          {nav.map((n) => (
            <button
              key={n.key}
              onClick={() => onNav(n.key)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-base font-semibold ${
                active === n.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {n.label}
              {!!n.badge && ` (${n.badge})`}
            </button>
          ))}
        </div>
        <main className="mx-auto w-full max-w-6xl flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export function Stat({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const tones = {
    primary: "bg-accent text-accent-foreground",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-destructive",
  };
  return (
    <div className="card-soft p-5">
      <div className={`grid h-12 w-12 place-items-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="mt-3 text-lg text-muted-foreground">{label}</div>
      <div className="mt-1 text-4xl font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

export function Pill({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger" | "muted";
  children: ReactNode;
}) {
  const t = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-destructive",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${t[tone]}`}>
      {children}
    </span>
  );
}

export function PageTitle({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
        {sub && <p className="mt-1.5 text-lg text-muted-foreground">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed p-10 text-center text-lg text-muted-foreground">
      {children}
    </div>
  );
}

export function Splash() {
  const { t } = useI18n();
  return (
    <div className="grid min-h-screen place-items-center bg-background text-xl font-semibold text-muted-foreground">
      {t("c.loading")}
    </div>
  );
}

/** Server yoki baza xatosi — qayta urinish tugmasi bilan. */
export function ErrorCard({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="card-soft m-5 p-6 text-center">
      <div className="text-xl font-bold text-destructive">{t("c.error")}</div>
      <p className="mt-2 text-lg text-muted-foreground">{errorMessage(t, error)}</p>
      <Button className="mt-4 h-11 px-5" onClick={onRetry}>
        {t("c.retry")}
      </Button>
    </div>
  );
}
