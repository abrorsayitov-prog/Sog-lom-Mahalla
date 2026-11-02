import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlarmClock,
  Check,
  Pencil,
  Phone,
  ShieldAlert,
  Stethoscope,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AuthScreen } from "@/components/AuthScreen";
import { Field, WrongRoleNotice } from "@/components/auth";
import {
  Empty,
  ErrorCard,
  type NavItem,
  PageTitle,
  Pill,
  Shell,
  Splash,
  Stat,
} from "@/components/Shell";
import { errorMessage, useI18n, type TKey } from "@/lib/i18n";
import { DoctorNetwork, HeroChip, PulseMark } from "@/components/Hero";
import {
  useAdminAlerts,
  useAdminDoctors,
  useAdminPatients,
  useAdminStats,
  useCreateDoctor,
  useDeleteDoctor,
  useDeletePatientByAdmin,
  usePatchDoctor,
} from "@/lib/queries";
import { useRequireRole } from "@/lib/session";
import type { Doctor, DoctorInput, DoctorPatch } from "@/lib/api";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin paneli — Sog‘lom Mahalla" },
      { name: "description", content: "Shifokorlar, bemorlar va platforma holatini boshqarish." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

const VIEWS = ["home", "doctors", "patients", "alerts"] as const;
type View = (typeof VIEWS)[number];

const NAV_ICON = { home: Activity, doctors: Stethoscope, patients: Users, alerts: AlarmClock };

function AdminPage() {
  const guard = useRequireRole("admin");
  if (!guard.ready) return <Splash />;
  if (guard.error) return <ErrorCard error={guard.error} onRetry={() => void guard.refetch()} />;
  if (guard.wrongRole) return <WrongRoleNotice signedInAs={guard.wrongRole} />;
  if (!guard.me) return <AuthScreen role="admin" />;
  return <AdminPanel />;
}

function AdminPanel() {
  const { t } = useI18n();
  const [view, setView] = useState<View>("home");
  const stats = useAdminStats();

  const nav: NavItem[] = VIEWS.map((key) => ({
    key,
    label: t(`nav.${key}` as TKey),
    icon: NAV_ICON[key],
    badge:
      key === "doctors"
        ? (stats.data?.pending ?? 0)
        : key === "alerts"
          ? (stats.data?.alerts ?? 0)
          : 0,
  }));

  return (
    <Shell role="admin" nav={nav} active={view} onNav={(k) => setView(k as View)}>
      {view === "home" && <AdminHome />}
      {view === "doctors" && <AdminDoctors />}
      {view === "patients" && <AdminPatients />}
      {view === "alerts" && <AdminAlerts />}
    </Shell>
  );
}

function AdminHome() {
  const { t } = useI18n();
  const stats = useAdminStats();
  const doctors = useAdminDoctors();
  const patients = useAdminPatients();
  const alerts = useAdminAlerts();
  const patch = usePatchDoctor();

  const allDoctors = doctors.data ?? [];
  const allPatients = patients.data ?? [];
  const pending = allDoctors.filter((d) => d.status === "pending");
  const alertDoctorIds = (alerts.data ?? []).map((row) => row.patient.doctorId);

  const act = (doctor: Doctor, status: Doctor["status"]) =>
    patch.mutate(
      { id: doctor.id, status },
      {
        onSuccess: () => toast.success(t("c.saved")),
        onError: (error) => toast.error(errorMessage(t, error)),
      },
    );

  return (
    <>
      <section className="hero-night px-6 py-7 md:px-10 md:py-9">
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <PulseMark className="h-8 w-24" />
              <span className="font-script text-3xl leading-none text-primary-foreground/80">
                {t("app.name")}
              </span>
            </div>
            <h1 className="font-display text-5d-light mt-3 text-4xl font-extrabold leading-tight md:text-5xl">
              {t("admin.title")}
            </h1>
            <p className="mt-3 text-xl font-semibold text-[#c3caff]">{t("admin.heroAccent")}</p>
            <p className="mt-1 text-lg text-primary-foreground/70">{t("admin.sub")}</p>
          </div>
          <DoctorNetwork
            doctors={allDoctors}
            patients={allPatients}
            alertDoctorIds={alertDoctorIds}
            className="h-48 w-full max-w-[27rem] shrink-0"
          />
        </div>

        <div className="relative mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <HeroChip
            icon={Users}
            label={t("admin.stat.patients")}
            value={stats.data?.patients ?? "—"}
          />
          <HeroChip
            icon={Stethoscope}
            label={t("admin.stat.activeDoctors")}
            value={stats.data?.doctors ?? "—"}
          />
          <HeroChip
            icon={UserPlus}
            label={t("admin.stat.pending")}
            value={stats.data?.pending ?? "—"}
          />
          <HeroChip
            icon={AlarmClock}
            label={t("admin.stat.alerts")}
            value={stats.data?.alerts ?? "—"}
          />
          <HeroChip
            icon={Activity}
            label={t("admin.stat.severe")}
            value={stats.data?.severe ?? "—"}
          />
          <HeroChip
            icon={Check}
            label={t("admin.stat.completed")}
            value={stats.data?.completedToday ?? "—"}
          />
        </div>
      </section>

      <h2 className="font-display mt-10 text-3xl font-extrabold">{t("admin.pendingTitle")}</h2>
      <div className="mt-4 space-y-3">
        {pending.length === 0 && <Empty>{t("admin.pendingEmpty")}</Empty>}
        {pending.map((doctor) => (
          <div key={doctor.id} className="card-5d flex flex-wrap items-center gap-3 p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-lg font-bold text-primary-foreground">
              {doctor.firstName.charAt(0)}
              {doctor.lastName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xl font-bold">
                {doctor.firstName} {doctor.lastName}
              </div>
              <div className="mt-0.5 text-base text-muted-foreground">
                {doctor.specialty || "—"} · {doctor.phone}
              </div>
            </div>
            <Button
              className="h-12 px-5 text-base"
              disabled={patch.isPending}
              onClick={() => act(doctor, "approved")}
            >
              <Check className="mr-2 h-5 w-5" /> {t("admin.approve")}
            </Button>
            <Button
              variant="outline"
              className="h-12 px-5 text-base"
              disabled={patch.isPending}
              onClick={() => act(doctor, "rejected")}
            >
              <ShieldAlert className="mr-2 h-5 w-5" /> {t("admin.reject")}
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}

const emptyDoctor: DoctorInput = {
  firstName: "",
  lastName: "",
  phone: "",
  specialty: "",
  password: "",
};

function DoctorForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  pending,
  error,
}: {
  initial: DoctorInput;
  submitLabel: string;
  onSubmit: (value: DoctorInput) => void;
  onCancel: () => void;
  pending: boolean;
  error: unknown;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState<DoctorInput>(initial);
  const set = (key: keyof DoctorInput) => (v: string) =>
    setValue((prev) => ({ ...prev, [key]: v }));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("c.firstName")} value={value.firstName} onChange={set("firstName")} />
        <Field label={t("c.lastName")} value={value.lastName} onChange={set("lastName")} />
      </div>
      <Field
        label={t("c.phone")}
        value={value.phone}
        onChange={set("phone")}
        inputMode="tel"
        maxLength={24}
      />
      <Field label={t("c.specialty")} value={value.specialty ?? ""} onChange={set("specialty")} />
      <Field
        label={t("c.password")}
        type="password"
        value={value.password}
        onChange={set("password")}
        autoComplete="new-password"
        maxLength={72}
      />
      {!!error && (
        <div
          role="alert"
          className="rounded-xl bg-danger-soft p-3 text-base font-semibold text-destructive"
        >
          {errorMessage(t, error)}
        </div>
      )}
      <div className="flex gap-3">
        <Button type="submit" className="h-12 flex-1 text-base" disabled={pending}>
          {pending ? t("c.saving") : submitLabel}
        </Button>
        <Button type="button" variant="outline" className="h-12 px-5 text-base" onClick={onCancel}>
          {t("c.cancel")}
        </Button>
      </div>
    </form>
  );
}

function AdminDoctors() {
  const { t } = useI18n();
  const doctors = useAdminDoctors();
  const create = useCreateDoctor();
  const patch = usePatchDoctor();
  const remove = useDeleteDoctor();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);

  const fail = (error: unknown) => toast.error(errorMessage(t, error));
  const setStatus = (doctor: Doctor, status: Doctor["status"]) =>
    patch.mutate(
      { id: doctor.id, status },
      {
        onSuccess: () => toast.success(t("c.saved")),
        onError: fail,
      },
    );

  return (
    <>
      <PageTitle
        title={t("admin.doctorsTitle")}
        sub={t("admin.doctorsSub")}
        right={
          <Button className="h-12 px-5 text-base" onClick={() => setAddOpen(true)}>
            <UserPlus className="mr-2 h-5 w-5" /> {t("admin.newDoctor")}
          </Button>
        }
      />
      {(doctors.data?.length ?? 0) === 0 && !doctors.isPending ? (
        <Empty>{t("admin.noDoctors")}</Empty>
      ) : (
        <div className="space-y-3">
          {(doctors.data ?? []).map((doctor) => (
            <div key={doctor.id} className="card-soft flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="text-xl font-bold">
                  {doctor.firstName} {doctor.lastName}
                </div>
                <div className="mt-0.5 text-base text-muted-foreground">
                  {doctor.specialty || "—"} · {doctor.phone}
                </div>
              </div>
              <Pill
                tone={
                  doctor.status === "approved"
                    ? "success"
                    : doctor.status === "pending"
                      ? "warning"
                      : "danger"
                }
              >
                {t(`status.${doctor.status}` as TKey)}
              </Pill>
              <div className="flex flex-wrap gap-2">
                {doctor.status !== "approved" && (
                  <Button
                    size="sm"
                    className="h-11 px-4 text-base"
                    onClick={() => setStatus(doctor, "approved")}
                  >
                    <Check className="mr-1.5 h-4 w-4" /> {t("admin.approve")}
                  </Button>
                )}
                {doctor.status === "approved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-11 px-4 text-base"
                    onClick={() => setStatus(doctor, "rejected")}
                  >
                    <ShieldAlert className="mr-1.5 h-4 w-4" /> {t("admin.block")}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-11 px-3"
                  onClick={() => setEditing(doctor)}
                >
                  <Pencil className="h-5 w-5" />
                  <span className="ml-1.5">{t("c.edit")}</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-11 px-3 text-destructive"
                  onClick={() => {
                    if (!window.confirm(t("c.confirmDelete"))) return;
                    remove.mutate(doctor.id, {
                      onSuccess: () => toast.success(t("c.saved")),
                      onError: fail,
                    });
                  }}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t("admin.newDoctor")}</DialogTitle>
            <DialogDescription className="sr-only">{t("admin.doctorsSub")}</DialogDescription>
          </DialogHeader>
          <DoctorForm
            initial={emptyDoctor}
            submitLabel={t("c.add")}
            pending={create.isPending}
            error={create.isError ? create.error : null}
            onCancel={() => setAddOpen(false)}
            onSubmit={(value) =>
              create.mutate(value, {
                onSuccess: () => {
                  setAddOpen(false);
                  toast.success(t("c.saved"));
                },
              })
            }
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t("admin.editDoctor")}</DialogTitle>
            <DialogDescription className="sr-only">{t("admin.doctorsSub")}</DialogDescription>
          </DialogHeader>
          {editing && (
            <DoctorForm
              key={editing.id}
              initial={{
                firstName: editing.firstName,
                lastName: editing.lastName,
                phone: editing.phone,
                specialty: editing.specialty,
                password: "",
              }}
              submitLabel={t("c.save")}
              pending={patch.isPending}
              error={patch.isError ? patch.error : null}
              onCancel={() => setEditing(null)}
              onSubmit={(value) => {
                const next: DoctorPatch = { ...value };
                if (!next.password) delete next.password;
                patch.mutate(
                  { id: editing.id, ...next },
                  {
                    onSuccess: () => {
                      setEditing(null);
                      toast.success(t("c.saved"));
                    },
                  },
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AdminPatients() {
  const { t } = useI18n();
  const patients = useAdminPatients();
  const remove = useDeletePatientByAdmin();
  const [query, setQuery] = useState("");

  const all = patients.data ?? [];
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? all.filter((p) =>
        `${p.firstName} ${p.lastName} ${p.phone} ${p.diagnosis} ${p.doctorName ?? ""}`
          .toLowerCase()
          .includes(needle),
      )
    : all;

  return (
    <>
      <PageTitle title={t("admin.patientsTitle")} sub={t("admin.patientsSub")} />
      <input
        className="field mb-5 text-base"
        placeholder={t("c.search")}
        aria-label={t("c.search")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {shown.length === 0 ? (
        <Empty>{all.length === 0 ? t("admin.noPatients") : t("c.empty")}</Empty>
      ) : (
        <div className="space-y-3">
          {shown.map((patient) => (
            <div key={patient.id} className="card-soft flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="text-xl font-bold">
                  {patient.firstName} {patient.lastName}
                </div>
                <div className="mt-0.5 text-base text-muted-foreground">
                  {patient.diagnosis || "—"} · {t("c.col.doctor")}: {patient.doctorName || "—"}
                </div>
              </div>
              <Pill
                tone={
                  patient.severity === "ogir"
                    ? "danger"
                    : patient.severity === "orta"
                      ? "warning"
                      : "success"
                }
              >
                {t(`sev.${patient.severity}` as TKey)}
              </Pill>
              {patient.dietNumber != null && (
                <Pill tone="muted">{t("diet.number", { n: patient.dietNumber })}</Pill>
              )}
              <a
                href={`tel:${patient.phone}`}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-secondary px-4 text-base font-semibold text-secondary-foreground"
              >
                <Phone className="h-4 w-4" /> {patient.phone}
              </a>
              <Button
                size="sm"
                variant="ghost"
                className="h-11 px-3 text-destructive"
                onClick={() => {
                  if (!window.confirm(t("c.confirmDelete"))) return;
                  remove.mutate(patient.id, {
                    onSuccess: () => toast.success(t("c.saved")),
                    onError: (error) => toast.error(errorMessage(t, error)),
                  });
                }}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function AdminAlerts() {
  const { t } = useI18n();
  const alerts = useAdminAlerts();
  const list = alerts.data ?? [];

  return (
    <>
      <PageTitle title={t("admin.alertsTitle")} sub={t("doctor.alertsSub")} />
      {list.length === 0 ? (
        <Empty>{t("admin.alertsEmpty")}</Empty>
      ) : (
        <div className="space-y-3">
          {list.map((row) => (
            <div key={row.patient.id} className="card-soft p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xl font-bold">
                    {row.patient.firstName} {row.patient.lastName}
                  </div>
                  <div className="mt-0.5 text-base text-muted-foreground">
                    {row.patient.doctorName || "—"} · {row.patient.phone}
                  </div>
                </div>
                <Pill tone="danger">{t("c.of", { a: row.missed, b: row.total })}</Pill>
                <a
                  href={`tel:${row.patient.phone}`}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-secondary px-4 text-base font-semibold text-secondary-foreground"
                >
                  <Phone className="h-4 w-4" /> {t("c.call")}
                </a>
              </div>
              <ul className="mt-3 space-y-1.5 text-lg">
                {row.missedList.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-bold text-destructive">{item.time}</span>
                    <span>{item.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
