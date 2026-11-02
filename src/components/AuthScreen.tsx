import { Logo } from "@/components/Shell";
import { LangSwitch } from "@/components/LangSwitch";
import { LoginForm } from "@/components/auth";
import { Link } from "@/components/Shell";
import { User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { Role } from "@/lib/api";

const PANELS: { role: Role; path: "/admin" | "/doctor" | "/patient"; icon: typeof User }[] = [
  { role: "patient", path: "/patient", icon: User },
  { role: "doctor", path: "/doctor", icon: User },
  { role: "admin", path: "/admin", icon: User },
];

/** Panelga kirmagan holda ochiladigan kirish ekrani (odamcha + globus tepada). */
export function AuthScreen({ role }: { role: Role }) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-sky">
      <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3 md:px-8">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <LangSwitch />
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand text-primary-foreground">
            <User className="h-6 w-6" />
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg px-4 py-8">
        <section className="card-soft p-6">
          <LoginForm role={role} />
        </section>
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-2 text-base">
          <span className="text-muted-foreground">{t("login.choose")}</span>
          {PANELS.map((p) => (
            <Link
              key={p.role}
              to={p.path}
              className={`rounded-full px-4 py-2 font-semibold ${
                p.role === role
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {t(`role.${p.role}`)}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
