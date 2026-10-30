import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Check, LogOut, Phone, Pill as PillIcon, Stethoscope, Utensils } from "lucide-react";
import { Logo, Pill, useGuard } from "@/components/Shell";
import { actions, nowHM, progress, severityLabel, useStore } from "@/lib/store";
import cover from "@/assets/patient-cover.jpg";
import food from "@/assets/healthy-food.jpg";

export const Route = createFileRoute("/patient")({
  head: () => ({
    meta: [
      { title: "Bemor paneli — Sog‘lom Mahalla" },
      {
        name: "description",
        content: "Kunlik dori va ovqatlanish jadvali, eslatmalar va shifokor bilan aloqa.",
      },
      { property: "og:title", content: "Bemor paneli — Sog‘lom Mahalla" },
      { property: "og:description", content: "Davolash rejangiz har doim yoningizda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PatientPanel,
});

function PatientPanel() {
  const navigate = useNavigate();
  const { patients, doctors } = useStore();
  const session = useGuard("patient");
  const [, tick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => tick((x) => x + 1), 30000);
    return () => clearInterval(i);
  }, []);
  if (!session || session.role !== "patient") return null;
  const p = patients.find((x) => x.id === session.id);
  if (!p) return null;
  const doc = doctors.find((d) => d.id === p.doctorId);
  const r = progress(p);
  const now = nowHM();
  const pct = r.total ? r.done / r.total : 0;
  const C = 2 * Math.PI * 34;

  return (
    <div className="min-h-screen bg-sky">
      <div className="mx-auto max-w-md px-5 pb-16 pt-6">
        <div className="flex items-center justify-between">
          <Logo />
          <button
            type="button"
            className="btn btn-ghost h-9 px-3"
            aria-label="Chiqish"
            onClick={() => {
              actions.logout();
              navigate({ to: "/", replace: true });
            }}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <div className="real-patient-cover">
          <img src={cover} width={1152} height={576} alt="Musaffo tog‘ manzarasi" />
          <p className="mt-8 text-sm text-muted-foreground">Assalomu alaykum,</p>
          <h1 className="text-3xl font-bold tracking-tight">
            {p.firstName} {p.lastName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Sizning davolash rejangiz</p>
        </div>

        {r.missed.length > 0 && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-danger-soft p-4 text-sm text-destructive">
            <Bell className="mt-0.5 h-5 w-5 shrink-0 animate-pulse" />
            <div>
              <b>Vaqti o‘tdi!</b> {r.missed.map((t) => `${t.time} — ${t.title}`).join(", ")}.
              Iltimos, bajarib belgilang.
            </div>
          </div>
        )}

        <div className="card-soft mt-5 flex items-center gap-5 p-5">
          <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90">
            <circle cx="42" cy="42" r="34" fill="none" strokeWidth="8" className="stroke-muted" />
            <circle
              cx="42"
              cy="42"
              r="34"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className="stroke-success transition-all"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
            />
          </svg>
          <div>
            <div className="text-3xl font-bold">
              {r.done}/{r.total}
            </div>
            <div className="text-sm text-muted-foreground">Bugun bajarilgan vazifalar</div>
            <div className="mt-2">
              <Pill tone={pct === 1 ? "success" : r.missed.length ? "danger" : "muted"}>
                {pct === 1 ? "Ajoyib!" : r.missed.length ? "E’tibor bering" : "Davom eting"}
              </Pill>
            </div>
          </div>
        </div>

        <div className="card-soft mt-4 grid grid-cols-2 gap-3 p-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Tashxis</div>
            <div className="font-semibold">{p.diagnosis}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Holat</div>
            <div className="font-semibold">{severityLabel[p.severity]}</div>
          </div>
        </div>

        <h2 className="mt-7 font-semibold">Bugungi reja</h2>
        <div className="card-soft mt-3 divide-y">
          {p.tasks.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Shifokor hali reja kiritmagan
            </div>
          )}
          {p.tasks.map((t) => {
            const done = r.doneIds.includes(t.id);
            const late = !done && t.time < now;
            return (
              <button
                type="button"
                key={t.id}
                aria-pressed={done}
                aria-label={`${t.time} ${t.title} — ${done ? "bajarilgan" : "bajarilmagan"}`}
                onClick={() => actions.toggleTask(p.id, t.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl ${t.type === "dori" ? "bg-accent text-accent-foreground" : "bg-warning-soft text-warning"}`}
                >
                  {t.type === "dori" ? (
                    <PillIcon className="h-4 w-4" />
                  ) : (
                    <Utensils className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm font-semibold ${done ? "text-muted-foreground line-through" : ""}`}
                  >
                    {t.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.time}
                    {t.note && ` · ${t.note}`}
                  </div>
                </div>
                <div
                  className={`grid h-7 w-7 place-items-center rounded-full border-2 transition ${done ? "border-success bg-success text-primary-foreground" : late ? "border-destructive" : "border-border"}`}
                >
                  {done && <Check className="h-4 w-4" />}
                </div>
              </button>
            );
          })}
        </div>

        <section className="card-soft real-food">
          <h2 className="text-sm font-semibold">Ovqatlanish rejasi</h2>
          <img
            src={food}
            width={1152}
            height={576}
            alt="Sut mahsulotlari, sabzavotlar va mevalar"
            loading="lazy"
          />
          <div className="food-labels">
            <span>Sut mahsulotlari</span>
            <span>Sabzavotlar</span>
            <span>Mevalar</span>
          </div>
        </section>
        {doc && (
          <div className="card-soft mt-5 flex items-center gap-3 p-4">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">
                Dr. {doc.firstName} {doc.lastName}
              </div>
              <div className="text-xs text-muted-foreground">{doc.specialty}</div>
            </div>
            <a
              href={`tel:${doc.phone.replace(/\s/g, "")}`}
              className="btn btn-primary h-9 px-3"
              aria-label={`Dr. ${doc.firstName} ${doc.lastName}ga qo‘ng‘iroq qilish`}
            >
              <Phone className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
