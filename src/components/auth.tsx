import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, KeyRound, LogOut, User, UserCog } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { errorMessage, useI18n, type TKey } from "@/lib/i18n";
import {
  useBootstrap,
  useChangePassword,
  useLogin,
  useLogout,
  useMe,
  useSiteConfig,
} from "@/lib/session";
import type { Me, Role } from "@/lib/api";

export const ROLE_PATH: Record<Role, "/admin" | "/doctor" | "/patient"> = {
  admin: "/admin",
  doctor: "/doctor",
  patient: "/patient",
};

export function displayName(me: Me): string {
  return me.role === "admin" ? me.name : `${me.firstName} ${me.lastName}`.trim();
}

/** Boshqa rol bilan kirilgan panel: manzilni almashtirishga yo'naltiramiz. */
export function WrongRoleNotice({ signedInAs }: { signedInAs: Role }) {
  const { t } = useI18n();
  const label = t(`role.${signedInAs}` as TKey);
  return (
    <div className="card-soft mx-auto mt-16 max-w-md p-6 text-center">
      <p className="mb-4 text-lg font-semibold">{t("login.wrongRole", { role: label })}</p>
      <Button asChild size="lg">
        <a href={ROLE_PATH[signedInAs]}>{t("login.goToPanel", { role: label })}</a>
      </Button>
    </div>
  );
}

/** Katta, aniq yozuvli form maydoni — barcha panellarda ishlatiladi. */
export function Field({
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  inputMode,
  maxLength,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  inputMode?: "search" | "text" | "none" | "tel" | "url" | "email" | "numeric" | "decimal";
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-foreground">{label}</span>
      <input
        className="field text-base"
        type={type}
        value={value}
        name={autoComplete ?? label}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/** Admin uchun login+parol, shifokor va bemor uchun telefon+parol. */
export function LoginForm({
  role,
  onSuccess,
}: {
  role: Role;
  onSuccess?: (() => void) | undefined;
}) {
  const { t } = useI18n();
  const config = useSiteConfig();
  const me = useMe();
  const login = useLogin();
  const bootstrap = useBootstrap();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [newLogin, setNewLogin] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const needsBootstrap = role === "admin" && !!config.data?.needsBootstrap;

  if (me.data?.role === role) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-success-soft p-4 font-semibold text-success">
        <Check className="h-5 w-5" /> {displayName(me.data)}
      </div>
    );
  }

  const pending = login.isPending || bootstrap.isPending;
  const error = login.isError ? login.error : bootstrap.isError ? bootstrap.error : null;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (needsBootstrap) {
          bootstrap.mutate(
            { login: newLogin, password: newPassword },
            {
              onSuccess: () =>
                login.mutate(
                  { role: "admin", identifier: newLogin, password: newPassword },
                  { onSuccess: () => onSuccess?.() },
                ),
            },
          );
          return;
        }
        login.mutate({ role, identifier, password }, { onSuccess: () => onSuccess?.() });
      }}
    >
      <div>
        <h3 className="text-xl font-bold">{t("login.heading")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("login.sub", { role: t(`role.${role}`) })}
        </p>
      </div>

      {needsBootstrap ? (
        <>
          <p className="rounded-xl bg-warning-soft p-3 text-sm font-medium text-warning">
            {t("login.bootstrapSub")}
          </p>
          <Field
            label={t("login.identifierLogin")}
            value={newLogin}
            onChange={setNewLogin}
            autoComplete="username"
          />
          <Field
            label={t("c.password")}
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
            {pending ? t("c.saving") : t("login.bootstrapSubmit")}
          </Button>
        </>
      ) : (
        <>
          <Field
            label={role === "admin" ? t("login.identifierLogin") : t("login.identifierPhone")}
            value={identifier}
            onChange={setIdentifier}
            autoComplete="username"
            inputMode={role === "admin" ? "text" : "tel"}
            placeholder={role === "admin" ? "admin" : "+998 90 123 45 67"}
            maxLength={role === "admin" ? 40 : 24}
          />
          <Field
            label={t("c.password")}
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            maxLength={72}
          />
          <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
            {pending ? t("login.working") : t("login.submit")}
          </Button>
          <p className="text-xs text-muted-foreground">{t(`login.hint.${role}`)}</p>
        </>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-danger-soft p-3 text-sm font-semibold text-destructive"
        >
          {errorMessage(t, error)}
        </div>
      )}
    </form>
  );
}

export function ChangePasswordForm({ onDone }: { onDone?: () => void }) {
  const { t } = useI18n();
  const change = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        change.mutate({ current, next }, { onSuccess: () => onDone?.() });
      }}
    >
      <div>
        <h3 className="text-xl font-bold">{t("settings.changePassword")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings.passwordChanged")}</p>
      </div>
      <Field
        label={t("c.currentPassword")}
        type="password"
        value={current}
        onChange={setCurrent}
        autoComplete="current-password"
      />
      <Field
        label={t("c.newPassword")}
        type="password"
        value={next}
        onChange={setNext}
        autoComplete="new-password"
        maxLength={72}
      />
      <Button type="submit" className="h-12 w-full text-base" disabled={change.isPending}>
        {change.isPending ? t("c.saving") : t("c.save")}
      </Button>
      {change.isError && (
        <div
          role="alert"
          className="rounded-xl bg-danger-soft p-3 text-sm font-semibold text-destructive"
        >
          {errorMessage(t, change.error)}
        </div>
      )}
    </form>
  );
}

/** Bosh sahifadagi odamcha: rolni tanlab kirish. */
export function RoleLogin({ onSuccess }: { onSuccess?: () => void }) {
  const { t } = useI18n();
  const [role, setRole] = useState<Role>("patient");
  const tabs: Role[] = ["patient", "doctor", "admin"];
  return (
    <div className="space-y-5">
      <div
        className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1"
        role="group"
        aria-label={t("login.pick")}
      >
        {tabs.map((r) => (
          <Button
            key={r}
            type="button"
            variant="ghost"
            onClick={() => setRole(r)}
            aria-pressed={role === r}
            className={`h-11 rounded-xl text-base font-bold ${
              role === r ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t(`role.${r}`)}
          </Button>
        ))}
      </div>
      <LoginForm key={role} role={role} onSuccess={onSuccess} />
    </div>
  );
}

/** Tepadagi odamcha: kirmagan — kirish oynasi, kirgan — profil menyusi. */
export function AccountButton({ role }: { role: Role }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const me = useMe();
  const logout = useLogout();
  const [loginOpen, setLoginOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const signedInName = me.data ? displayName(me.data) : "";

  if (!me.data) {
    return (
      <>
        <Button
          variant="default"
          className="h-11 gap-2 px-4 text-base"
          onClick={() => setLoginOpen(true)}
        >
          <User className="h-5 w-5" />
          <span className="hidden sm:inline">{t("top.login")}</span>
        </Button>
        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="sr-only">{t("login.person")}</DialogTitle>
              <DialogDescription className="sr-only">{t("login.heading")}</DialogDescription>
            </DialogHeader>
            <LoginForm role={role} onSuccess={() => setLoginOpen(false)} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-11 gap-2 px-3 text-base">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-primary-foreground">
              <UserCog className="h-5 w-5" />
            </span>
            <span className="hidden max-w-40 truncate font-semibold md:inline">
              {signedInName || t("top.profile")}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuLabel className="text-sm">
            {t(`role.${me.data.role}`)}
            <span className="block text-xs font-normal text-muted-foreground">{signedInName}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
            <KeyRound className="h-4 w-4" /> {t("top.changePassword")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              logout.mutate(undefined, {
                onSuccess: () => navigate({ to: ROLE_PATH[role] }),
              })
            }
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" /> {t("top.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">{t("top.changePassword")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("settings.changePassword")}
            </DialogDescription>
          </DialogHeader>
          <ChangePasswordForm onDone={() => setPasswordOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
