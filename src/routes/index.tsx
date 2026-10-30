import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Stethoscope, User, X } from "lucide-react";
import { Logo } from "@/components/Shell";
import { actions, useStore } from "@/lib/store";
import { ConceptDashboard } from "@/components/ConceptDashboard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kirish — Sog‘lom Mahalla" },
      {
        name: "description",
        content: "Sog‘lom Mahalla tibbiy platformasi: admin, shifokor va bemor uchun kirish.",
      },
      { property: "og:title", content: "Sog‘lom Mahalla — Kirish" },
      {
        property: "og:description",
        content: "Dori va ovqatlanish jadvalini kuzatuvchi tibbiy platforma.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

type Tab = "patient" | "doctor" | "admin";

function Login() {
  const navigate = useNavigate();
  const { session } = useStore();
  const [tab, setTab] = useState<Tab>("patient");
  const [showLogin, setShowLogin] = useState(false);
  const [f, setF] = useState({ first: "", last: "", phone: "+998 ", login: "", pass: "" });
  const [msg, setMsg] = useState<{ tone: "err" | "info"; text: string } | null>(null);

  useEffect(() => {
    if (session) navigate({ to: `/${session.role}` as "/admin", replace: true });
  }, [session, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (tab === "admin") {
      if (!actions.loginAdmin(f.login, f.pass))
        setMsg({ tone: "err", text: "Login yoki parol noto‘g‘ri" });
      return;
    }
    if (!f.first.trim() || !f.last.trim() || f.phone.replace(/\D/g, "").length < 9) {
      setMsg({ tone: "err", text: "Ism, familiya va telefon raqamini to‘liq kiriting" });
      return;
    }
    if (tab === "doctor") {
      const s = actions.loginDoctor(f.first, f.last, f.phone);
      if (s === "pending")
        setMsg({
          tone: "info",
          text: "So‘rovingiz Adminga yuborildi. Tasdiqlangandan so‘ng shu ma’lumotlar bilan qayta kiring.",
        });
      if (s === "rejected") setMsg({ tone: "err", text: "Admin so‘rovingizni rad etgan." });
    } else if (!actions.loginPatient(f.first, f.last, f.phone)) {
      setMsg({
        tone: "err",
        text: "Bunday bemor topilmadi. Shifokoringiz sizni ro‘yxatga kiritganiga ishonch hosil qiling.",
      });
    }
  };

  const tabs: { k: Tab; label: string; icon: typeof User }[] = [
    { k: "patient", label: "Bemor", icon: User },
    { k: "doctor", label: "Shifokor", icon: Stethoscope },
    { k: "admin", label: "Admin", icon: ShieldCheck },
  ];

  return (
    <>
      <ConceptDashboard
        onLogin={(role) => {
          setTab(role);
          setMsg(null);
          setShowLogin(true);
        }}
      />
      {showLogin && (
        <div className="login-overlay" onClick={() => setShowLogin(false)}>
          <form
            onSubmit={submit}
            className="login-form"
            role="dialog"
            aria-modal="true"
            aria-label="Panelga kirish"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="login-close"
              aria-label="Kirish oynasini yopish"
              onClick={() => setShowLogin(false)}
            >
              <X />
            </Button>
            <Logo />
            <h2 className="mt-6 text-2xl font-bold">Xush kelibsiz</h2>
            <p className="mt-1 text-sm text-muted-foreground">Kim sifatida kirasiz?</p>

            <div className="mt-6 grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
              {tabs.map((t) => (
                <Button
                  variant="ghost"
                  type="button"
                  key={t.k}
                  onClick={() => {
                    setTab(t.k);
                    setMsg(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition ${tab === t.k ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </Button>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              {tab === "admin" ? (
                <>
                  <input
                    className="field"
                    aria-label="Administrator logini"
                    name="login"
                    autoComplete="username"
                    placeholder="Login"
                    value={f.login}
                    onChange={(e) => setF({ ...f, login: e.target.value })}
                  />
                  <input
                    className="field"
                    type="password"
                    aria-label="Parol"
                    name="password"
                    autoComplete="current-password"
                    placeholder="Parol"
                    value={f.pass}
                    onChange={(e) => setF({ ...f, pass: e.target.value })}
                  />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="field"
                      aria-label="Ism"
                      name="firstName"
                      autoComplete="given-name"
                      placeholder="Ism"
                      value={f.first}
                      maxLength={50}
                      onChange={(e) => setF({ ...f, first: e.target.value })}
                    />
                    <input
                      className="field"
                      aria-label="Familiya"
                      name="lastName"
                      autoComplete="family-name"
                      placeholder="Familiya"
                      value={f.last}
                      maxLength={50}
                      onChange={(e) => setF({ ...f, last: e.target.value })}
                    />
                  </div>
                  <input
                    className="field"
                    inputMode="tel"
                    type="tel"
                    aria-label="Telefon raqami"
                    name="phone"
                    autoComplete="tel"
                    placeholder="+998 90 123 45 67"
                    value={f.phone}
                    maxLength={20}
                    onChange={(e) => setF({ ...f, phone: e.target.value })}
                  />
                </>
              )}
            </div>

            {msg && (
              <div
                role="alert"
                className={`mt-4 rounded-xl p-3 text-sm ${msg.tone === "err" ? "bg-danger-soft text-destructive" : "bg-accent text-accent-foreground"}`}
              >
                {msg.text}
              </div>
            )}

            <Button type="submit" className="mt-6 h-11 w-full">
              Kirish
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              {tab === "doctor" && "Birinchi marta kirsangiz, so‘rov Admin tasdig‘iga yuboriladi."}
              {tab === "patient" &&
                "Shifokoringiz kiritgan ism, familiya va telefon raqam bilan kiring."}
              {tab === "admin" && "Faqat platforma administratori uchun."}
            </p>
          </form>
        </div>
      )}
    </>
  );
}
