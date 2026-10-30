import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Bell, type LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";
import { actions } from "@/lib/store";
import { Button } from "@/components/ui/button";

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
        className={`logo-name text-lg font-bold ${light ? "text-primary-foreground" : "text-foreground"}`}
      >
        Sog‘lom Mahalla
      </span>
    </div>
  );
}

export type NavItem = { key: string; label: string; icon: LucideIcon; badge?: number };

export function Shell({
  user,
  role,
  nav,
  active,
  onNav,
  children,
}: {
  user: string;
  role: string;
  nav: NavItem[];
  active: string;
  onNav: (k: string) => void;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const logout = () => {
    actions.logout();
    navigate({ to: "/", replace: true });
  };
  return (
    <div
      className={`real-shell flex min-h-screen w-full ${role === "Administrator" ? "admin-shell" : "doctor-shell"}`}
    >
      <aside className="real-sidebar sticky top-0 hidden h-screen w-56 shrink-0 flex-col bg-nav p-5 text-nav-foreground md:flex">
        <Logo light />
        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-sidebar-accent p-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-brand font-bold text-primary-foreground">
            {user.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-primary-foreground">{user}</div>
            <div className="text-xs opacity-70">{role}</div>
          </div>
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <button
              key={n.key}
              onClick={() => onNav(n.key)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active === n.key
                  ? "bg-nav-active text-primary-foreground"
                  : "hover:bg-sidebar-accent"
              }`}
            >
              <n.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{n.label}</span>
              {!!n.badge && (
                <span className="rounded-full bg-destructive px-2 text-xs text-destructive-foreground">
                  {n.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" /> Chiqish
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="real-topbar hidden md:flex">
          <span>Sog‘lom Mahalla · {role}</span>
          <Bell className="h-4 w-4 text-primary" />
          <div className="concept-avatar">{user.charAt(0)}</div>
        </div>
        <header className="flex items-center justify-between gap-3 border-b bg-card/70 px-5 py-3 backdrop-blur md:hidden">
          <Logo />
          <button type="button" onClick={logout} className="btn btn-ghost h-9" aria-label="Chiqish">
            <LogOut className="h-4 w-4" />
          </button>
        </header>
        <div className="flex gap-2 overflow-x-auto border-b bg-card px-4 py-2 md:hidden">
          {nav.map((n) => (
            <button
              key={n.key}
              onClick={() => onNav(n.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${active === n.key ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              {n.label}
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
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-bold tracking-tight">{value}</div>
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
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${t[tone]}`}>
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
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export { Link };

import { useEffect as _useEffect, useState as _useState } from "react";
import { useStore } from "@/lib/store";
/** Redirects to login after hydration if the stored session doesn't match the role. */
export function useGuard(role: "admin" | "doctor" | "patient") {
  const { session } = useStore();
  const navigate = useNavigate();
  const [ready, setReady] = _useState(false);
  _useEffect(() => setReady(true), []);
  _useEffect(() => {
    if (ready && session?.role !== role) navigate({ to: "/", replace: true });
  }, [ready, session, role, navigate]);
  return ready && session?.role === role ? session : null;
}
