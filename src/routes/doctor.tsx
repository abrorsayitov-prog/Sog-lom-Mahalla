import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlarmClock,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Home,
  Pencil,
  Phone,
  Pill as PillIcon,
  Plus,
  Save,
  Trash2,
  UserPlus,
  Users,
  Utensils,
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
import { displayName, Field, WrongRoleNotice } from "@/components/auth";
import { DietCard, customContent, standardContent, StandardDietList } from "@/components/DietView";
import {
  Empty,
  ErrorCard,
  type NavItem,
  PageTitle,
  Pill,
  Shell,
  Splash,
} from "@/components/Shell";
import { GlossyHeart, HeroChip, TinyCross } from "@/components/Hero";
import { errorMessage, useI18n, type TKey } from "@/lib/i18n";
import { STANDARD_DIETS } from "@/lib/diets";
import {
  useCreateDiet,
  useCreatePatient,
  useCreateTask,
  useDeleteDiet,
  useDeletePatient,
  useDeleteTask,
  useDoctorDiets,
  useDoctorPlan,
  usePatchDiet,
  usePatchPatient,
  usePatchTask,
} from "@/lib/queries";
import { useRequireRole } from "@/lib/session";
import {
  planState,
  type CustomDiet,
  type DietPayload,
  type Patient,
  type PatientInput,
  type Task,
} from "@/lib/api";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "Shifokor paneli — Sog‘lom Mahalla" },
      {
        name: "description",
        content: "Bemorlarni qo‘shish, davolash rejasi va parhez stollarini kiritish.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DoctorPage,
});

const VIEWS = ["home", "patients", "diets", "alerts"] as const;
type View = (typeof VIEWS)[number];

const NAV_ICON = { home: Home, patients: Users, diets: Utensils, alerts: AlarmClock };

const SEVERITIES: Patient["severity"][] = ["yengil", "orta", "ogir"];

function DoctorPage() {
  const guard = useRequireRole("doctor");
  if (!guard.ready) return <Splash />;
  if (guard.error) return <ErrorCard error={guard.error} onRetry={() => void guard.refetch()} />;
  if (guard.wrongRole) return <WrongRoleNotice signedInAs={guard.wrongRole} />;
  if (!guard.me) return <AuthScreen role="doctor" />;
  return <DoctorPanel name={displayName(guard.me)} />;
}

function useSummary() {
  const plan = useDoctorPlan();
  const data = plan.data;
  const summary = !data
    ? null
    : data.patients.map((patient) => ({
        patient,
        state: planState(patient, data.tasks, data.logs, data.serverNow),
      }));
  return { plan, summary };
}

function DoctorPanel({ name }: { name: string }) {
  const { t } = useI18n();
  const [view, setView] = useState<View>("home");
  const [openId, setOpenId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [dietTab, setDietTab] = useState<"standard" | "custom">("standard");
  const { summary } = useSummary();

  const missedCount = (summary ?? []).filter((row) => row.state.missed.length > 0).length;
  const nav: NavItem[] = VIEWS.map((key) => ({
    key,
    label: t(`nav.${key}` as TKey),
    icon: NAV_ICON[key],
    badge: key === "alerts" ? missedCount : 0,
  }));

  const openRow = (summary ?? []).find((row) => row.patient.id === openId) ?? null;

  return (
    <Shell
      role="doctor"
      nav={nav}
      active={view}
      onNav={(k) => {
        setOpenId(null);
        setView(k as View);
      }}
    >
      {view === "home" && (
        <DoctorHome
          name={name}
          summary={summary ?? []}
          onOpen={(id) => {
            setOpenId(id);
            setView("patients");
          }}
          onAdd={() => setAddOpen(true)}
        />
      )}
      {view === "patients" &&
        (openRow ? (
          <PatientDetail
            key={openRow.patient.id}
            row={openRow}
            onBack={() => setOpenId(null)}
            onAdd={() => setAddOpen(true)}
          />
        ) : (
          <PatientsList summary={summary ?? []} onOpen={setOpenId} onAdd={() => setAddOpen(true)} />
        ))}
      {view === "diets" && <DietsTab summary={summary ?? []} tab={dietTab} onTab={setDietTab} />}
      {view === "alerts" && <DoctorAlerts summary={summary ?? []} />}

      <AddPatientDialog open={addOpen} onOpenChange={setAddOpen} />
    </Shell>
  );
}

/** Yangi bemor oynasi — yaratish mutatsiyasini shu komponent o'zida oladi. */
function AddPatientDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const create = useCreatePatient();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t("doctor.newPatient")}</DialogTitle>
          <DialogDescription className="sr-only">{t("doctor.patientsTitle")}</DialogDescription>
        </DialogHeader>
        <PatientForm
          initial={null}
          pending={create.isPending}
          error={create.isError ? create.error : null}
          onCancel={() => onOpenChange(false)}
          onSubmit={(value) =>
            create.mutate(value, {
              onSuccess: () => {
                onOpenChange(false);
                toast.success(t("c.saved"));
              },
            })
          }
        />
      </DialogContent>
    </Dialog>
  );
}

function DoctorHome({
  name,
  summary,
  onOpen,
  onAdd,
}: {
  name: string;
  summary: { patient: Patient; state: ReturnType<typeof planState> }[];
  onOpen: (id: string) => void;
  onAdd: () => void;
}) {
  const { t } = useI18n();
  const doneCount = summary.filter(
    (row) => row.state.total > 0 && row.state.done === row.state.total,
  ).length;
  const missedCount = summary.filter((row) => row.state.missed.length > 0).length;
  const severeCount = summary.filter((row) => row.patient.severity === "ogir").length;

  return (
    <>
      <section className="hero-poster px-6 py-7 md:px-10 md:py-9">
        <TinyCross className="drift pointer-events-none absolute right-[15%] top-7 h-7 w-7 text-primary-foreground/15" />
        <TinyCross className="drift-slow pointer-events-none absolute left-[44%] top-28 h-5 w-5 text-primary-foreground/10" />
        <TinyCross className="drift pointer-events-none absolute bottom-9 left-[5%] h-9 w-9 text-primary-foreground/10" />

        <div className="relative flex flex-wrap items-center gap-6">
          <div className="min-w-0 flex-1">
            <p className="font-script text-3xl leading-none text-primary-foreground/85">
              {t("app.name")}
            </p>
            <h1 className="font-display text-5d-light mt-2 text-4xl font-extrabold leading-tight md:text-5xl">
              {t("doctor.welcome", { name })}
            </h1>
            <p className="mt-3 text-xl font-semibold text-primary-foreground/90">
              {t("doctor.heroAccent")}
            </p>
            <p className="mt-1 text-lg text-primary-foreground/70">{t("doctor.sub")}</p>
            <Button
              className="mt-6 h-12 bg-card px-5 text-base text-foreground shadow-lift hover:bg-card/90"
              onClick={onAdd}
            >
              <UserPlus className="mr-2 h-5 w-5" /> {t("doctor.addPatient")}
            </Button>
          </div>
          <GlossyHeart className="drift h-36 w-36 shrink-0 md:h-48 md:w-48" />
        </div>

        <div className="relative mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <HeroChip icon={Users} label={t("doctor.stat.patients")} value={summary.length} />
          <HeroChip icon={CheckCircle2} label={t("doctor.stat.done")} value={doneCount} />
          <HeroChip icon={AlarmClock} label={t("doctor.stat.missed")} value={missedCount} />
          <HeroChip icon={PillIcon} label={t("doctor.stat.severe")} value={severeCount} />
        </div>
      </section>

      <PatientsList summary={summary} onOpen={onOpen} onAdd={onAdd} compact />
    </>
  );
}

function Progress({ state }: { state: ReturnType<typeof planState> }) {
  const { t } = useI18n();
  const percent = state.total ? Math.round((state.done / state.total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 w-28 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-success" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-base font-bold">{t("c.of", { a: state.done, b: state.total })}</span>
      {state.missed.length > 0 && <Pill tone="danger">{state.missed.length}</Pill>}
    </div>
  );
}

function PatientsList({
  summary,
  onOpen,
  onAdd,
  compact = false,
}: {
  summary: { patient: Patient; state: ReturnType<typeof planState> }[];
  onOpen: (id: string) => void;
  onAdd: () => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? summary.filter((row) =>
        `${row.patient.firstName} ${row.patient.lastName} ${row.patient.phone} ${row.patient.diagnosis}`
          .toLowerCase()
          .includes(needle),
      )
    : summary;

  return (
    <>
      {!compact && (
        <PageTitle
          title={t("doctor.patientsTitle")}
          sub={t("c.count", { n: summary.length })}
          right={
            <Button className="h-12 px-5 text-base" onClick={onAdd}>
              <UserPlus className="mr-2 h-5 w-5" /> {t("doctor.addPatient")}
            </Button>
          }
        />
      )}
      {!compact && (
        <input
          className="field mb-5 text-base"
          aria-label={t("c.search")}
          placeholder={t("doctor.searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      {compact && (
        <h2 className="mb-4 mt-10 text-2xl font-extrabold">{t("doctor.patientsTitle")}</h2>
      )}
      {shown.length === 0 ? (
        <Empty>{summary.length === 0 ? t("doctor.patientsEmpty") : t("c.empty")}</Empty>
      ) : (
        <div className="space-y-3">
          {shown.map((row) => (
            <div key={row.patient.id} className="card-soft flex flex-wrap items-center gap-3 p-4">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onOpen(row.patient.id)}
              >
                <div className="text-xl font-bold">
                  {row.patient.firstName} {row.patient.lastName}
                </div>
                <div className="mt-0.5 text-base text-muted-foreground">
                  {row.patient.diagnosis || "—"} · {row.patient.phone}
                </div>
              </button>
              <Progress state={row.state} />
              <Pill
                tone={
                  row.patient.severity === "ogir"
                    ? "danger"
                    : row.patient.severity === "orta"
                      ? "warning"
                      : "success"
                }
              >
                {t(`sev.${row.patient.severity}` as TKey)}
              </Pill>
              {row.patient.dietNumber != null && (
                <Pill tone="muted">{t("diet.number", { n: row.patient.dietNumber })}</Pill>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-11 px-4 text-base"
                onClick={() => onOpen(row.patient.id)}
              >
                {t("doctor.openPatient")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function PatientDetail({
  row,
  onBack,
  onAdd,
}: {
  row: { patient: Patient; state: ReturnType<typeof planState> };
  onBack: () => void;
  onAdd: () => void;
}) {
  const { t, lang } = useI18n();
  const plan = useDoctorPlan();
  const diets = useDoctorDiets();
  const patchPatient = usePatchPatient();
  const removePatient = useDeletePatient();
  const createTask = useCreateTask();
  const patchTask = usePatchTask();
  const deleteTask = useDeleteTask();
  const [editing, setEditing] = useState(false);

  const patient = row.patient;
  const tasks = (plan.data?.tasks ?? []).filter((task) => task.patientId === patient.id);
  const assignedCustom = (diets.data ?? []).find((diet) => diet.id === patient.dietId) ?? null;
  const fail = (error: unknown) => toast.error(errorMessage(t, error));

  return (
    <>
      <button
        type="button"
        className="mb-4 inline-flex items-center gap-2 text-lg font-semibold"
        onClick={onBack}
      >
        <ArrowLeft className="h-5 w-5" /> {t("c.back")}
      </button>
      <PageTitle
        title={`${patient.firstName} ${patient.lastName}`}
        sub={`${patient.diagnosis || "—"} · ${patient.phone}`}
        right={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-12 px-5 text-base"
              onClick={() => setEditing((v) => !v)}
            >
              <Pencil className="mr-2 h-5 w-5" /> {t("c.edit")}
            </Button>
            <a
              href={`tel:${patient.phone}`}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-secondary px-5 text-base font-semibold text-secondary-foreground"
            >
              <Phone className="h-5 w-5" /> {t("c.call")}
            </a>
          </div>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
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
        <Progress state={row.state} />
        {patient.dietNumber != null && (
          <Pill tone="muted">{t("diet.number", { n: patient.dietNumber })}</Pill>
        )}
        {patient.dietId && <Pill tone="muted">{t("diet.customTag")}</Pill>}
      </div>

      {editing && (
        <div className="card-soft mb-6 p-5">
          <PatientForm
            initial={patient}
            pending={patchPatient.isPending}
            error={patchPatient.isError ? patchPatient.error : null}
            onCancel={() => setEditing(false)}
            onSubmit={(value) => {
              const patch = { ...value };
              if (!patch.password) delete (patch as Partial<PatientInput>).password;
              patchPatient.mutate(
                { id: patient.id, ...patch },
                {
                  onSuccess: () => {
                    setEditing(false);
                    toast.success(t("c.saved"));
                  },
                  onError: () => {},
                },
              );
            }}
            onDelete={() => {
              if (!window.confirm(t("c.confirmDelete"))) return;
              removePatient.mutate(patient.id, {
                onSuccess: () => {
                  onBack();
                  toast.success(t("c.saved"));
                },
                onError: fail,
              });
            }}
          />
        </div>
      )}

      <section className="card-soft p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold">{t("patient.dietHeading")}</h2>
          {(patient.dietNumber != null || patient.dietId != null) && (
            <Button
              variant="outline"
              className="h-11 px-4 text-base"
              onClick={() =>
                patchPatient.mutate(
                  { id: patient.id, dietNumber: null, dietId: null },
                  { onSuccess: () => toast.success(t("c.saved")), onError: fail },
                )
              }
            >
              {t("c.none")}
            </Button>
          )}
        </div>
        <div className="mt-4">
          <StandardDietList
            selected={patient.dietNumber}
            onPick={(number) =>
              patchPatient.mutate(
                { id: patient.id, dietNumber: number, dietId: null },
                { onSuccess: () => toast.success(t("c.saved")), onError: fail },
              )
            }
          />
        </div>
        {(diets.data?.length ?? 0) > 0 && (
          <div className="mt-5">
            <h3 className="text-lg font-bold">{t("doctor.custom")}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {(diets.data ?? []).map((diet) => (
                <Button
                  key={diet.id}
                  variant={patient.dietId === diet.id ? "default" : "outline"}
                  className="h-12 px-4 text-base"
                  onClick={() =>
                    patchPatient.mutate(
                      {
                        id: patient.id,
                        dietId: patient.dietId === diet.id ? null : diet.id,
                        dietNumber: null,
                      },
                      { onSuccess: () => toast.success(t("c.saved")), onError: fail },
                    )
                  }
                >
                  {diet.number} · {diet.payload.title}
                </Button>
              ))}
            </div>
            {assignedCustom && (
              <div className="mt-3">
                <DietCard content={customContent(assignedCustom, lang)} open />
              </div>
            )}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-2xl font-extrabold">{t("doctor.tasksHeading")}</h2>
        <div className="mt-4 space-y-3">
          {tasks.length === 0 && <Empty>{t("patient.planEmpty")}</Empty>}
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              state={row.state}
              onPatch={(patch) =>
                patchTask.mutate(
                  { id: task.id, ...patch },
                  { onSuccess: () => toast.success(t("c.saved")), onError: fail },
                )
              }
              onDelete={() =>
                deleteTask.mutate(task.id, {
                  onSuccess: () => toast.success(t("c.saved")),
                  onError: fail,
                })
              }
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            className="h-12 px-5 text-base"
            onClick={() =>
              createTask.mutate(
                {
                  patientId: patient.id,
                  time: "09:00",
                  title: "",
                  note: "",
                  type: "dori",
                  remind: true,
                },
                { onSuccess: () => toast.success(t("c.saved")), onError: fail },
              )
            }
          >
            <Plus className="mr-2 h-5 w-5" /> {t("doctor.addDrug")}
          </Button>
          <Button
            variant="outline"
            className="h-12 px-5 text-base"
            onClick={() =>
              createTask.mutate(
                {
                  patientId: patient.id,
                  time: "13:00",
                  title: "",
                  note: "",
                  type: "ovqat",
                  remind: true,
                },
                { onSuccess: () => toast.success(t("c.saved")), onError: fail },
              )
            }
          >
            <Plus className="mr-2 h-5 w-5" /> {t("doctor.addFood")}
          </Button>
          <Button variant="ghost" className="h-12 px-5 text-base" onClick={onAdd}>
            <UserPlus className="mr-2 h-5 w-5" /> {t("doctor.addPatient")}
          </Button>
        </div>
      </section>
    </>
  );
}

function TaskRow({
  task,
  state,
  onPatch,
  onDelete,
}: {
  task: Task;
  state: ReturnType<typeof planState>;
  onPatch: (patch: {
    time?: string;
    title?: string;
    note?: string;
    type?: Task["type"];
    remind?: boolean;
  }) => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const done = state.doneIds.includes(task.id);
  const missed = state.missed.some((item) => item.id === task.id);

  return (
    <div className={`card-soft p-4 ${missed ? "border-2 border-destructive/50" : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-extrabold ${
            done
              ? "bg-success-soft text-success"
              : missed
                ? "bg-danger-soft text-destructive"
                : "bg-accent"
          }`}
          title={task.type === "dori" ? t("task.dori") : t("task.ovqat")}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {task.time}
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-xl font-bold">{task.title || t("doctor.taskTitle")}</div>
          {task.note && <div className="mt-0.5 text-base text-muted-foreground">{task.note}</div>}
        </div>
        <Pill tone={task.type === "dori" ? "muted" : "warning"}>
          {t(`task.${task.type}` as TKey)}
        </Pill>
        {task.remind && <Pill tone="success">{t("doctor.remind")}</Pill>}
        <ChevronDown className={`h-5 w-5 text-muted-foreground ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <div className="mt-4 grid gap-3 md:grid-cols-[7rem_1fr_1fr_auto]">
          <input
            type="time"
            className="field text-base"
            aria-label={t("c.time")}
            value={task.time}
            onChange={(e) => onPatch({ time: e.target.value })}
          />
          <input
            className="field text-base"
            aria-label={t("doctor.taskTitle")}
            placeholder={t("doctor.taskTitle")}
            defaultValue={task.title}
            onBlur={(e) => e.target.value !== task.title && onPatch({ title: e.target.value })}
          />
          <input
            className="field text-base"
            aria-label={t("c.note")}
            placeholder={t("c.note")}
            defaultValue={task.note}
            onBlur={(e) => e.target.value !== task.note && onPatch({ note: e.target.value })}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-11 px-3 text-base"
              onClick={() => onPatch({ type: task.type === "dori" ? "ovqat" : "dori" })}
            >
              {task.type === "dori" ? (
                <PillIcon className="h-5 w-5" />
              ) : (
                <Utensils className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="outline"
              className="h-11 px-3 text-base"
              onClick={() => onPatch({ remind: !task.remind })}
            >
              <AlarmClock className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              className="h-11 px-3 text-destructive"
              onClick={() => {
                if (!window.confirm(t("c.confirmDelete"))) return;
                onDelete();
              }}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const emptyPatient: PatientInput = {
  firstName: "",
  lastName: "",
  phone: "+998 ",
  password: "",
  diagnosis: "",
  severity: "yengil",
  tzMinutes: 300,
};

/** Yangi bemor / bemor ma'lumotlari — telefon + parol bilan kirish uchun. */
function PatientForm({
  initial,
  pending,
  error,
  onCancel,
  onSubmit,
  onDelete,
}: {
  initial: Patient | null;
  pending: boolean;
  error: unknown;
  onCancel: () => void;
  onSubmit: (value: PatientInput) => void;
  onDelete?: () => void;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState<PatientInput>({
    firstName: initial?.firstName ?? emptyPatient.firstName,
    lastName: initial?.lastName ?? emptyPatient.lastName,
    phone: initial?.phone ?? emptyPatient.phone,
    password: "",
    diagnosis: initial?.diagnosis ?? "",
    severity: initial?.severity ?? "yengil",
    tzMinutes: initial?.tzMinutes ?? 300,
  });
  const set = <K extends keyof PatientInput>(key: K, v: PatientInput[K]) =>
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
        <Field
          label={t("c.firstName")}
          value={value.firstName}
          onChange={(v) => set("firstName", v)}
        />
        <Field
          label={t("c.lastName")}
          value={value.lastName}
          onChange={(v) => set("lastName", v)}
        />
      </div>
      <Field
        label={t("c.phone")}
        value={value.phone}
        onChange={(v) => set("phone", v)}
        inputMode="tel"
        maxLength={24}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={initial ? t("doctor.passwordKeep") : t("doctor.passwordSet")}
          type="password"
          value={value.password ?? ""}
          onChange={(v) => set("password", v)}
          autoComplete="new-password"
          maxLength={72}
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">{t("doctor.timezone")}</span>
          <input
            className="field text-base"
            type="number"
            min={-720}
            max={840}
            step={15}
            value={value.tzMinutes}
            aria-label={t("doctor.timezone")}
            onChange={(e) => set("tzMinutes", Number(e.target.value) || 0)}
          />
        </label>
      </div>
      <Field
        label={t("c.diagnosis")}
        value={value.diagnosis ?? ""}
        onChange={(v) => set("diagnosis", v)}
      />
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("c.severity")}>
        {SEVERITIES.map((severity) => (
          <Button
            key={severity}
            type="button"
            variant={value.severity === severity ? "default" : "outline"}
            className="h-12 text-base font-bold"
            aria-pressed={value.severity === severity}
            onClick={() => set("severity", severity)}
          >
            {t(`sev.${severity}` as TKey)}
          </Button>
        ))}
      </div>
      {!!error && (
        <div
          role="alert"
          className="rounded-xl bg-danger-soft p-3 text-base font-semibold text-destructive"
        >
          {errorMessage(t, error)}
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="h-12 flex-1 text-base" disabled={pending}>
          <Save className="mr-2 h-5 w-5" /> {pending ? t("c.saving") : t("c.save")}
        </Button>
        <Button type="button" variant="outline" className="h-12 px-5 text-base" onClick={onCancel}>
          {t("c.cancel")}
        </Button>
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            className="h-12 px-5 text-base text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-5 w-5" /> {t("c.delete")}
          </Button>
        )}
      </div>
    </form>
  );
}

function DoctorAlerts({
  summary,
}: {
  summary: { patient: Patient; state: ReturnType<typeof planState> }[];
}) {
  const { t } = useI18n();
  const rows = summary.filter((row) => row.state.missed.length > 0);
  return (
    <>
      <PageTitle title={t("doctor.alertsTitle")} sub={t("doctor.alertsSub")} />
      {rows.length === 0 ? (
        <Empty>{t("doctor.alertsEmpty")}</Empty>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.patient.id} className="card-soft p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xl font-bold">
                    {row.patient.firstName} {row.patient.lastName}
                  </div>
                  <div className="mt-0.5 text-base text-muted-foreground">
                    {row.patient.diagnosis || "—"} · {row.patient.phone}
                  </div>
                </div>
                <a
                  href={`tel:${row.patient.phone}`}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-secondary px-4 text-base font-semibold text-secondary-foreground"
                >
                  <Phone className="h-4 w-4" /> {t("c.call")}
                </a>
              </div>
              <ul className="mt-3 space-y-1.5 text-lg">
                {row.state.missed.map((task) => (
                  <li key={task.id} className="flex gap-3">
                    <span className="font-bold text-destructive">{task.time}</span>
                    <span>{task.title}</span>
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

const emptyPayload: DietPayload = {
  title: "",
  purpose: "",
  indications: [],
  allowed: [],
  limited: [],
  forbidden: [],
  menu: [],
};

const LIST_FIELDS = [
  { key: "indications", labelKey: "diet.indications" },
  { key: "allowed", labelKey: "diet.allowed" },
  { key: "limited", labelKey: "diet.limited" },
  { key: "forbidden", labelKey: "diet.forbidden" },
  { key: "menu", labelKey: "diet.menu" },
] as const;

function DietForm({
  initial,
  onSubmit,
  onCancel,
  pending,
  error,
}: {
  initial: { number: number; payload: DietPayload } | null;
  onSubmit: (value: { number: number; payload: DietPayload }) => void;
  onCancel: () => void;
  pending: boolean;
  error: unknown;
}) {
  const { t } = useI18n();
  const [number, setNumber] = useState(initial?.number ?? 16);
  const [payload, setPayload] = useState<DietPayload>(initial?.payload ?? emptyPayload);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ number, payload });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">{t("diet.numberLabel")}</span>
          <input
            className="field text-base"
            type="number"
            min={1}
            max={99}
            value={number}
            aria-label={t("diet.numberLabel")}
            onChange={(e) => setNumber(Number(e.target.value) || 1)}
          />
        </label>
        <Field
          label={t("diet.title")}
          value={payload.title}
          onChange={(v) => setPayload({ ...payload, title: v })}
        />
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">{t("diet.purpose")}</span>
        <textarea
          className="min-h-24 w-full rounded-xl border-2 bg-card p-3 text-base"
          value={payload.purpose}
          onChange={(e) => setPayload({ ...payload, purpose: e.target.value })}
        />
      </label>
      {LIST_FIELDS.map((field) => (
        <label key={field.key} className="block">
          <span className="mb-1.5 block text-sm font-semibold">
            {t(field.labelKey as TKey)}{" "}
            <span className="font-normal text-muted-foreground">· {t("diet.perLine")}</span>
          </span>
          <textarea
            className="min-h-20 w-full rounded-xl border-2 bg-card p-3 text-base"
            defaultValue={payload[field.key].join("\n")}
            onChange={(e) =>
              setPayload({
                ...payload,
                [field.key]: e.target.value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
      ))}
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
          {pending ? t("c.saving") : t("c.save")}
        </Button>
        <Button type="button" variant="outline" className="h-12 px-5 text-base" onClick={onCancel}>
          {t("c.cancel")}
        </Button>
      </div>
    </form>
  );
}

function DietsTab({
  summary,
  tab,
  onTab,
}: {
  summary: { patient: Patient; state: ReturnType<typeof planState> }[];
  tab: "standard" | "custom";
  onTab: (tab: "standard" | "custom") => void;
}) {
  const { t, lang } = useI18n();
  const diets = useDoctorDiets();
  const create = useCreateDiet();
  const patch = usePatchDiet();
  const remove = useDeleteDiet();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomDiet | null>(null);
  const [openNumber, setOpenNumber] = useState<number | null>(null);
  const [openCustom, setOpenCustom] = useState<string | null>(null);

  const countForStandard = (n: number) =>
    summary.filter((row) => row.patient.dietNumber === n).length;
  const countForCustom = (id: string) => summary.filter((row) => row.patient.dietId === id).length;
  const fail = (error: unknown) => toast.error(errorMessage(t, error));

  return (
    <>
      <PageTitle
        title={t("doctor.dietTitle")}
        sub={t("doctor.dietSub")}
        right={
          <Button className="h-12 px-5 text-base" onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-5 w-5" /> {t("doctor.newDiet")}
          </Button>
        }
      />
      <div
        className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1"
        role="group"
        aria-label={t("doctor.dietTitle")}
      >
        {(["standard", "custom"] as const).map((key) => (
          <Button
            key={key}
            type="button"
            variant="ghost"
            aria-pressed={tab === key}
            className={`h-12 rounded-xl text-base font-bold ${
              tab === key ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
            }`}
            onClick={() => onTab(key)}
          >
            {t(`doctor.${key}` as TKey)}
          </Button>
        ))}
      </div>

      {tab === "standard" ? (
        <div className="space-y-3">
          {STANDARD_DIETS.map((diet) => (
            <div key={diet.number}>
              <DietCard
                content={standardContent(diet, lang)}
                open={openNumber === diet.number}
                onToggle={() => setOpenNumber(openNumber === diet.number ? null : diet.number)}
              />
              {countForStandard(diet.number) > 0 && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {t("doctor.filterPatients")}:{" "}
                  {t("diet.assignedTo", { n: countForStandard(diet.number) })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(diets.data?.length ?? 0) === 0 && !diets.isPending && (
            <Empty>{t("doctor.noCustom")}</Empty>
          )}
          {(diets.data ?? []).map((diet) => (
            <div key={diet.id}>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <DietCard
                    content={customContent(diet, lang)}
                    open={openCustom === diet.id}
                    onToggle={() => setOpenCustom(openCustom === diet.id ? null : diet.id)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-11 px-3"
                    onClick={() => setEditing(diet)}
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-11 px-3 text-destructive"
                    onClick={() => {
                      if (!window.confirm(t("c.confirmDelete"))) return;
                      remove.mutate(diet.id, {
                        onSuccess: () => toast.success(t("c.saved")),
                        onError: fail,
                      });
                    }}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              {countForCustom(diet.id) > 0 && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {t("doctor.filterPatients")}:{" "}
                  {t("diet.assignedTo", { n: countForCustom(diet.id) })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t("doctor.newDiet")}</DialogTitle>
            <DialogDescription className="sr-only">{t("doctor.dietSub")}</DialogDescription>
          </DialogHeader>
          <DietForm
            initial={null}
            pending={create.isPending}
            error={create.isError ? create.error : null}
            onCancel={() => setFormOpen(false)}
            onSubmit={(value) =>
              create.mutate(value, {
                onSuccess: () => {
                  setFormOpen(false);
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{t("doctor.editDiet")}</DialogTitle>
            <DialogDescription className="sr-only">{t("doctor.dietSub")}</DialogDescription>
          </DialogHeader>
          {editing && (
            <DietForm
              key={editing.id}
              initial={{ number: editing.number, payload: editing.payload }}
              pending={patch.isPending}
              error={patch.isError ? patch.error : null}
              onCancel={() => setEditing(null)}
              onSubmit={(value) =>
                patch.mutate(
                  { id: editing.id, ...value },
                  {
                    onSuccess: () => {
                      setEditing(null);
                      toast.success(t("c.saved"));
                    },
                  },
                )
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
