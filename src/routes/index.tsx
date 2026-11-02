import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Stethoscope, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LangSwitch } from "@/components/LangSwitch";
import { Logo, Link } from "@/components/Shell";
import { RoleLogin, ROLE_PATH } from "@/components/auth";
import { useI18n, type TKey } from "@/lib/i18n";
import { useMe } from "@/lib/session";
import type { Role } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sog‘lom Mahalla — kirish" },
      {
        name: "description",
        content:
          "Dori, ovqatlanish va davolanish nazorati: admin, shifokor va bemor uchun alohida panellar.",
      },
      { property: "og:title", content: "Sog‘lom Mahalla" },
      {
        property: "og:description",
        content: "Har bir panel o‘z manzilida ochiladi: admin, shifokor, bemor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Entry,
});

const CARDS: { role: Role; icon: typeof User; tint: string; descKey: TKey }[] = [
  {
    role: "patient",
    icon: User,
    tint: "bg-success-soft text-success",
    descKey: "login.hint.patient",
  },
  {
    role: "doctor",
    icon: Stethoscope,
    tint: "bg-accent text-accent-foreground",
    descKey: "login.hint.doctor",
  },
  {
    role: "admin",
    icon: ShieldCheck,
    tint: "bg-warning-soft text-warning",
    descKey: "login.hint.admin",
  },
];

function Entry() {
  const { t } = useI18n();
  const me = useMe();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (me.data) navigate({ to: ROLE_PATH[me.data.role], replace: true });
  }, [me.data, navigate]);

  return (
    <div className="min-h-screen bg-sky">
      <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3 md:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <LangSwitch />
          <Button
            className="h-11 gap-2 px-4 text-base"
            onClick={() => setOpen(true)}
            aria-label={t("top.login")}
          >
            <User className="h-5 w-5" />
            <span className="hidden sm:inline">{t("top.login")}</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8 md:py-12">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t("login.choose")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t("login.chooseSub")}</p>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {CARDS.map((card) => (
            <Link
              key={card.role}
              to={ROLE_PATH[card.role]}
              className="card-soft group flex flex-col p-6 transition hover:shadow-lift focus-visible:ring-4"
            >
              <span className={`grid h-14 w-14 place-items-center rounded-2xl ${card.tint}`}>
                <card.icon className="h-8 w-8" />
              </span>
              <span className="mt-4 text-2xl font-extrabold">{t(`role.${card.role}`)}</span>
              <span className="mt-2 flex-1 text-lg leading-snug text-muted-foreground">
                {t(card.descKey)}
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-lg font-bold text-primary">
                {t("login.open")}
              </span>
            </Link>
          ))}
        </div>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">{t("login.heading")}</DialogTitle>
            <DialogDescription className="sr-only">{t("login.person")}</DialogDescription>
          </DialogHeader>
          <RoleLogin onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
