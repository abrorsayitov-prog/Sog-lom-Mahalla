import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  BellRing,
  Check,
  Phone,
  Pill as PillIcon,
  RefreshCw,
  Stethoscope,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthScreen } from "@/components/AuthScreen";
import { WrongRoleNotice } from "@/components/auth";
import { DietCard, customContent, standardContent } from "@/components/DietView";
import { CareEmblem, CareWave } from "@/components/Hero";
import { Empty, ErrorCard, PageTitle, Pill, Splash, TopBar } from "@/components/Shell";
import { errorMessage, useI18n, type TKey } from "@/lib/i18n";
import { STANDARD_DIETS } from "@/lib/diets";
import { useToggleTask, usePatientHome } from "@/lib/queries";
import { useRequireRole, useSiteConfig } from "@/lib/session";
import { usePatientAlarm } from "@/lib/use-alarm";
import { playAlarmSound, vibratePhone } from "@/lib/alarm";
import {
  askNotificationPermission,
  createPushSubscription,
  notificationPermission,
  pingServiceWorker,
  pushSupported,
} from "@/lib/pwa";
import { planState, api } from "@/lib/api";

export const Route = createFileRoute("/patient")({
  head: () => ({
    meta: [
      { title: "Bemor paneli — Sog‘lom Mahalla" },
      {
        name: "description",
        content:
          "Kunlik dori va ovqatlanish jadvali, budilnik eslatmalari va shifokor bilan aloqa.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PatientPage,
});

function PatientPage() {
  const guard = useRequireRole("patient");
  if (!guard.ready) return <Splash />;
  if (guard.error) return <ErrorCard error={guard.error} onRetry={() => void guard.refetch()} />;
  if (guard.wrongRole) return <WrongRoleNotice signedInAs={guard.wrongRole} />;
  if (!guard.me) return <AuthScreen role="patient" />;
  return <PatientPanel />;
}

function PatientPanel() {
  const { t, lang } = useI18n();
  const home = usePatientHome();
  usePatientAlarm(home.data);

  if (home.error) return <ErrorCard error={home.error} onRetry={() => void home.refetch()} />;
  if (!home.data) return <Splash />;

  const data = home.data;
  const state = planState(data.patient, data.tasks, data.logs, data.serverNow);
  const tasks = data.tasks.filter((task) => task.patientId === data.patient.id);
  const mine = data.patient;
  const percent = state.total ? Math.round((state.done / state.total) * 100) : 0;
  const circumference = 2 * Math.PI * 34;

  const standard = mine.dietNumber
    ? (STANDARD_DIETS.find((diet) => diet.number === mine.dietNumber) ?? null)
    : null;

  return (
    <div className="min-h-screen bg-sky">
      <TopBar role="patient" />
      <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6">
        <section className="hero-cream px-5 py-6 md:px-7">
          <div className="flex items-center gap-4">
            <CareEmblem className="h-20 w-20 shrink-0 md:h-24 md:w-24" />
            <div className="min-w-0 flex-1">
              <p
                className="font-script text-2xl leading-none"
                style={{ color: "var(--gold-deep)" }}
              >
                {t("patient.greeting")}
              </p>
              <h1 className="font-display text-5d-gold mt-1 text-3xl font-extrabold leading-tight md:text-4xl">
                {mine.firstName} {mine.lastName}
              </h1>
              <p className="mt-1 text-lg font-semibold opacity-80">{t("patient.planLabel")}</p>
              <p className="text-base opacity-65">{t("patient.heroAccent")}</p>
            </div>
          </div>

          {state.missed.length > 0 && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-danger-soft p-4 text-lg text-destructive">
              <Bell className="mt-1 h-6 w-6 shrink-0 animate-pulse" />
              <div>
                {t("notif.missed.title")}.{" "}
                {state.missed.map((task) => `${task.time} — ${task.title}`).join(", ")}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-5">
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 84 84" className="-rotate-90 w-full" aria-hidden="true">
                <circle cx="42" cy="42" r="34" fill="none" strokeWidth="9" stroke="#f0e2c6" />
                <circle
                  cx="42"
                  cy="42"
                  r="34"
                  fill="none"
                  strokeWidth="9"
                  strokeLinecap="round"
                  stroke="#dfae55"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - percent / 100)}
                  style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-2xl font-extrabold">
                {percent}%
              </span>
            </div>
            <div>
              <div className="text-3xl font-extrabold">
                {t("c.of", { a: state.done, b: state.total })}
              </div>
              <div className="text-lg opacity-70">{t("patient.doneLabel")}</div>
              <div className="mt-2">
                <Pill tone={percent === 100 ? "success" : state.missed.length ? "danger" : "muted"}>
                  {percent === 100
                    ? t("patient.progressGreat")
                    : state.missed.length
                      ? t("patient.progressLate")
                      : t("patient.progressGoOn")}
                </Pill>
              </div>
            </div>
            <div className="ml-auto rounded-2xl bg-white/70 px-4 py-2 text-right text-base font-bold shadow-soft">
              <div>{state.date}</div>
              <div className="opacity-70">{state.time}</div>
            </div>
          </div>
        </section>

        <div className="card-soft mt-4 grid grid-cols-2 gap-4 p-5 text-lg">
          <div>
            <div className="text-sm text-muted-foreground">{t("c.diagnosis")}</div>
            <div className="font-bold">{mine.diagnosis || "—"}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t("c.severity")}</div>
            <div className="font-bold">{t(`sev.${mine.severity}` as TKey)}</div>
          </div>
        </div>

        <h2 className="mt-8 text-2xl font-extrabold">{t("patient.today")}</h2>
        <div className="card-soft mt-3 divide-y">
          {tasks.length === 0 && (
            <div className="p-6 text-center text-lg text-muted-foreground">
              {t("patient.planEmpty")}
            </div>
          )}
          {tasks.map((task) => (
            <TaskButton
              key={task.id}
              task={task}
              done={state.doneIds.includes(task.id)}
              late={task.time < state.time}
            />
          ))}
        </div>

        <Notifications />

        <section className="mt-8">
          <PageTitle title={t("patient.dietHeading")} />
          {!standard && !data.customDiet && <Empty>{t("patient.dietNone")}</Empty>}
          {standard && <DietCard content={standardContent(standard, lang)} open />}
          {data.customDiet && <DietCard content={customContent(data.customDiet, lang)} open />}
        </section>

        {data.doctor && (
          <section
            className="card-5d mt-6 flex flex-wrap items-center gap-4 p-5"
            style={{
              backgroundImage: "linear-gradient(140deg, #1c4f97, #123a75 55%, #0b2a58)",
              borderColor: "#c9963f",
              color: "#eaf2ff",
            }}
          >
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full"
              style={{
                backgroundImage: "radial-gradient(circle at 32% 26%, #f4dc9a, #dfae55 62%, #b98a34)",
                color: "#0b2a58",
              }}
            >
              <Stethoscope className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base opacity-75">{t("patient.doctorCard")}</div>
              <div className="font-display text-2xl font-extrabold">
                Dr. {data.doctor.firstName} {data.doctor.lastName}
              </div>
              <div className="text-base opacity-75">{data.doctor.specialty || "—"}</div>
            </div>
            <a
              href={`tel:${data.doctor.phone}`}
              className="inline-flex h-12 items-center gap-2 rounded-xl px-5 text-base font-extrabold"
              style={{
                backgroundImage: "linear-gradient(135deg, #f4dc9a, #dfae55)",
                color: "#0b2a58",
              }}
            >
              <Phone className="h-5 w-5" /> {t("c.call")}
            </a>
          </section>
        )}

        <p className="mt-6 flex items-center gap-2 text-base text-muted-foreground">
          <RefreshCw className="h-4 w-4" /> {t("patient.autoRefresh")}
        </p>
      </main>

      <div className="relative mt-4">
        <CareWave className="block h-28 w-full" />
        <div className="bg-[#0b2a58] px-4 py-3 text-center text-base font-semibold text-[#cfe0f7]">
          {t("app.tagline")}
        </div>
      </div>
    </div>
  );
}

function TaskButton({
  task,
  done,
  late,
}: {
  task: { id: string; time: string; title: string; note: string; type: "dori" | "ovqat" };
  done: boolean;
  late: boolean;
}) {
  const { t } = useI18n();
  const toggle = useToggleTask();
  return (
    <button
      type="button"
      aria-pressed={done}
      className="flex w-full items-center gap-4 p-4 text-left"
      onClick={() =>
        toggle.mutate(task.id, {
          onSuccess: () => toast.success(t("c.saved")),
          onError: (error) => toast.error(errorMessage(t, error)),
        })
      }
    >
      <div
        className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-base font-extrabold text-primary-foreground ${
          done ? "" : "next-ring"
        }`}
        style={{
          backgroundImage: done
            ? "radial-gradient(circle at 32% 26%, #7fd8a6, #2f9e63 55%, #14663f)"
            : late
              ? "radial-gradient(circle at 32% 26%, #ff9aa6, #d6455c 55%, #8c1f33)"
              : "radial-gradient(circle at 32% 26%, #2f6bb0, #123a75 55%, #0b2a58)",
          boxShadow: done
            ? "inset 0 1px 0 rgba(255,255,255,.45), 0 8px 18px -8px rgba(11,42,88,.55)"
            : undefined,
        }}
      >
        {task.time}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-xl font-bold ${done ? "text-muted-foreground line-through" : ""}`}>
          {task.title || t("doctor.taskTitle")}
        </div>
        <div className="text-lg text-muted-foreground">
          {task.time}
          {task.note && ` · ${task.note}`}
        </div>
      </div>
      <div
        className={`grid h-11 w-11 place-items-center rounded-full border-2 transition ${
          done
            ? "border-[color:var(--gold-deep)] bg-success text-primary-foreground"
            : late
              ? "border-destructive"
              : "border-border"
        }`}
      >
        {done && <Check className="h-5 w-5" />}
      </div>
    </button>
  );
}

/** Budilnik sozlamasi: ruxsat + push obunasi + sinov. */
function Notifications() {
  const { t } = useI18n();
  const config = useSiteConfig();
  const [permission, setPermission] = useState(notificationPermission());
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported()) return;
    let active = true;
    void (async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (active) setSubscribed(!!subscription);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Ochiq tabda ham vaqt kelganda jiringlash uchun worker'ni muntazam uyg‘otamiz.
  useEffect(() => {
    const interval = setInterval(() => void pingServiceWorker(), 60_000);
    void pingServiceWorker();
    return () => clearInterval(interval);
  }, []);

  const key = config.data?.vapidPublicKey ?? null;

  const enable = async () => {
    setBusy(true);
    const answer = await askNotificationPermission();
    setPermission(answer);
    if (answer !== "granted") {
      setBusy(false);
      return;
    }
    const endpoint = await createPushSubscription(key);
    if (endpoint) {
      try {
        await api.subscribe(endpoint);
        setSubscribed(true);
        toast.success(t("patient.notifOn"));
      } catch (error) {
        toast.error(errorMessage(t, error));
      }
    } else {
      toast.success(t("patient.notifOn"));
    }
    setBusy(false);
  };

  return (
    <section className="card-soft mt-6 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-danger-soft text-destructive">
          <BellRing className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold">{t("patient.notifications")}</h2>
          <p className="text-base text-muted-foreground">
            {permission === "unsupported"
              ? t("patient.notifUnsupported")
              : permission === "denied"
                ? t("patient.notifBlocked")
                : subscribed || permission === "granted"
                  ? t("patient.notifOn")
                  : t("patient.notifHint")}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {permission !== "granted" && permission !== "unsupported" && (
          <Button className="h-12 px-5 text-base" disabled={busy} onClick={() => void enable()}>
            {t("patient.notifEnable")}
          </Button>
        )}
        {permission === "unsupported" && (
          <Button className="h-12 px-5 text-base" disabled>
            {t("patient.notifEnable")}
          </Button>
        )}
        <Button
          variant="outline"
          className="h-12 px-5 text-base"
          onClick={() => {
            playAlarmSound();
            vibratePhone();
          }}
        >
          {t("patient.notifTest")}
        </Button>
      </div>
      {permission === "granted" && !key && (
        <p className="mt-3 rounded-xl bg-warning-soft p-3 text-base font-semibold text-warning">
          {t("patient.notifNeedsServer")}
        </p>
      )}
    </section>
  );
}
