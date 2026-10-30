import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Home, Phone, Pill as PillIcon, Plus, Search, Trash2, UserPlus, Users, Utensils, X } from "lucide-react";
import { Empty, PageTitle, Pill, Shell, Stat, useGuard } from "@/components/Shell";
import { actions, progress, severityLabel, uid, useStore, type Patient, type Severity, type Task } from "@/lib/store";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "Shifokor paneli — Sog‘lom Mahalla" },
      { name: "description", content: "Bemorlarni qo‘shish, davolash rejasi va kunlik bajarilishini kuzatish." },
      { property: "og:title", content: "Shifokor paneli — Sog‘lom Mahalla" },
      { property: "og:description", content: "Bemorlar va davolash rejalarini boshqarish." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Doctor,
});

const sevTone = (s: Severity): "danger" | "warning" | "success" => (s === "ogir" ? "danger" : s === "orta" ? "warning" : "success");

function Doctor() {
  const { doctors, patients } = useStore();
  const session = useGuard("doctor");
  const [tab, setTab] = useState("home");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Patient | "new" | null>(null);
  if (!session || session.role !== "doctor") return null;
  const me = doctors.find((d) => d.id === session.id);
  if (!me) return null;

  const mine = patients.filter((p) => p.doctorId === me.id);
  const alerts = mine.filter((p) => progress(p).missed.length > 0);
  const filtered = mine.filter((p) => `${p.firstName} ${p.lastName} ${p.phone} ${p.diagnosis}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <Shell user={`Dr. ${me.firstName} ${me.lastName}`} role={me.specialty} active={tab} onNav={setTab}
      nav={[
        { key: "home", label: "Bosh sahifa", icon: Home },
        { key: "patients", label: "Bemorlar", icon: Users },
        { key: "alerts", label: "Ogohlantirishlar", icon: AlertTriangle, badge: alerts.length },
      ]}>
      {tab === "home" && (
        <>
          <PageTitle title={`Xush kelibsiz, Dr. ${me.firstName}`} sub="Bugungi kun bo‘yicha bemorlaringiz va vazifalar"
            right={<button className="btn btn-primary" onClick={() => setEditing("new")}><UserPlus className="h-4 w-4" /> Bemor qo‘shish</button>} />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat icon={Users} label="Jami bemorlar" value={mine.length} />
            <Stat icon={CheckCircle2} label="Bugun to‘liq bajargan" value={mine.filter((p) => { const r = progress(p); return r.total > 0 && r.done === r.total; }).length} tone="success" />
            <Stat icon={AlertTriangle} label="O‘tkazib yuborgan" value={alerts.length} tone="danger" />
            <Stat icon={PillIcon} label="Og‘ir holat" value={mine.filter((p) => p.severity === "ogir").length} tone="warning" />
          </div>
          <PatientTable list={mine.slice(0, 6)} onEdit={setEditing} />
        </>
      )}
      {tab === "patients" && (
        <>
          <PageTitle title="Bemorlar ro‘yxati" sub={`Jami: ${mine.length}`}
            right={<button className="btn btn-primary" onClick={() => setEditing("new")}><UserPlus className="h-4 w-4" /> Bemor qo‘shish</button>} />
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input className="field pl-9" placeholder="Bemor qidirish (ism, telefon, kasallik)" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <PatientTable list={filtered} onEdit={setEditing} />
        </>
      )}
      {tab === "alerts" && (
        <>
          <PageTitle title="Ogohlantirishlar" sub="Vaqtida bajarilmagan vazifalar — bemor bilan bog‘laning" />
          <div className="space-y-3">
            {alerts.length === 0 && <Empty>Hamma bemorlar vazifalarni o‘z vaqtida bajarmoqda</Empty>}
            {alerts.map((p) => (
              <div key={p.id} className="card-soft flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="font-semibold">{p.firstName} {p.lastName} <span className="text-sm font-normal text-muted-foreground">· {p.diagnosis}</span></div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {progress(p).missed.map((t) => <Pill key={t.id} tone="danger">{t.time} {t.title}</Pill>)}
                  </div>
                </div>
                <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="btn btn-primary h-9"><Phone className="h-4 w-4" /> Qo‘ng‘iroq</a>
              </div>
            ))}
          </div>
        </>
      )}
      {editing && <PatientForm doctorId={me.id} initial={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </Shell>
  );
}

function PatientTable({ list, onEdit }: { list: Patient[]; onEdit: (p: Patient) => void }) {
  return (
    <div className="card-soft mt-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-xs text-muted-foreground">
          <tr><th className="p-3">Ism Familiya</th><th className="p-3">Telefon</th><th className="p-3">Kasallik</th><th className="p-3">Bugun</th><th className="p-3">Holat</th><th className="p-3"></th></tr>
        </thead>
        <tbody>
          {list.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Hali bemor qo‘shilmagan</td></tr>}
          {list.map((p) => { const r = progress(p); return (
            <tr key={p.id} className="cursor-pointer border-t hover:bg-muted/50" onClick={() => onEdit(p)}>
              <td className="p-3 font-medium">{p.firstName} {p.lastName}</td>
              <td className="p-3">{p.phone}</td>
              <td className="p-3">{p.diagnosis}</td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"><div className="h-full bg-success" style={{ width: `${r.total ? (r.done / r.total) * 100 : 0}%` }} /></div>
                  <span className="text-xs">{r.done}/{r.total}</span>
                  {r.missed.length > 0 && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                </div>
              </td>
              <td className="p-3"><Pill tone={sevTone(p.severity)}>{severityLabel[p.severity]}</Pill></td>
              <td className="p-3 text-right text-xs text-primary">Ochish ›</td>
            </tr>); })}
        </tbody>
      </table>
    </div>
  );
}

function PatientForm({ doctorId, initial, onClose }: { doctorId: string; initial: Patient | null; onClose: () => void }) {
  const [f, setF] = useState({
    firstName: initial?.firstName ?? "", lastName: initial?.lastName ?? "", phone: initial?.phone ?? "+998 ",
    diagnosis: initial?.diagnosis ?? "", severity: initial?.severity ?? ("yengil" as Severity),
  });
  const [tasks, setTasks] = useState<Task[]>(initial?.tasks ?? [
    { id: uid(), time: "08:00", title: "Nonushta", note: "", type: "ovqat" },
  ]);
  const [err, setErr] = useState("");
  const upd = (id: string, patch: Partial<Task>) => setTasks(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const save = () => {
    if (!f.firstName.trim() || !f.lastName.trim() || f.phone.replace(/\D/g, "").length < 9 || !f.diagnosis.trim()) {
      setErr("Ism, familiya, telefon va tashxisni to‘ldiring"); return;
    }
    const clean = tasks.filter((t) => t.title.trim()).sort((a, b) => a.time.localeCompare(b.time));
    if (initial) actions.updatePatient(initial.id, { ...f, tasks: clean });
    else actions.addPatient({ ...f, doctorId, tasks: clean });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 backdrop-blur-sm md:items-center md:p-6" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-card p-6 md:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{initial ? "Bemor ma’lumotlari" : "Yangi bemor"}</h2>
          <button className="btn btn-ghost h-9 px-2" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input className="field" placeholder="Ism" maxLength={50} value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} />
          <input className="field" placeholder="Familiya" maxLength={50} value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} />
          <input className="field" placeholder="Telefon" maxLength={20} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <input className="field" placeholder="Tashxis (masalan: Shamollash)" maxLength={100} value={f.diagnosis} onChange={(e) => setF({ ...f, diagnosis: e.target.value })} />
          <div className="flex gap-2 md:col-span-2">
            {(["yengil", "orta", "ogir"] as Severity[]).map((s) => (
              <button key={s} type="button" onClick={() => setF({ ...f, severity: s })}
                className={`btn h-9 flex-1 ${f.severity === s ? "btn-primary" : "btn-ghost"}`}>{severityLabel[s]}</button>
            ))}
          </div>
        </div>

        <h3 className="mt-6 font-semibold">Kunlik reja — dori va ovqatlanish</h3>
        <div className="mt-3 space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="grid grid-cols-[auto_5.5rem_1fr_auto] items-center gap-2 rounded-xl bg-muted p-2 md:grid-cols-[auto_5.5rem_1fr_1fr_auto]">
              <button type="button" onClick={() => upd(t.id, { type: t.type === "dori" ? "ovqat" : "dori" })}
                className={`grid h-9 w-9 place-items-center rounded-lg ${t.type === "dori" ? "bg-accent text-accent-foreground" : "bg-warning-soft text-warning"}`}
                title="Turini almashtirish">
                {t.type === "dori" ? <PillIcon className="h-4 w-4" /> : <Utensils className="h-4 w-4" />}
              </button>
              <input type="time" className="field h-9 px-2" value={t.time} onChange={(e) => upd(t.id, { time: e.target.value })} />
              <input className="field h-9" placeholder={t.type === "dori" ? "Dori nomi" : "Ovqat"} value={t.title} onChange={(e) => upd(t.id, { title: e.target.value })} />
              <input className="field hidden h-9 md:block" placeholder="Izoh (doza, tarkib)" value={t.note} onChange={(e) => upd(t.id, { note: e.target.value })} />
              <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => setTasks(tasks.filter((x) => x.id !== t.id))}><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <button type="button" className="btn btn-ghost h-9" onClick={() => setTasks([...tasks, { id: uid(), time: "09:00", title: "", note: "", type: "dori" }])}><Plus className="h-4 w-4" /> Dori</button>
          <button type="button" className="btn btn-ghost h-9" onClick={() => setTasks([...tasks, { id: uid(), time: "13:00", title: "", note: "", type: "ovqat" }])}><Plus className="h-4 w-4" /> Ovqat</button>
        </div>

        {err && <div className="mt-4 rounded-xl bg-danger-soft p-3 text-sm text-destructive">{err}</div>}
        <div className="mt-6 flex justify-between gap-2">
          {initial ? <button className="btn btn-ghost text-destructive" onClick={() => { if (confirm("O‘chirilsinmi?")) { actions.deletePatient(initial.id); onClose(); } }}><Trash2 className="h-4 w-4" /> O‘chirish</button> : <span />}
          <button className="btn btn-primary" onClick={save}>Saqlash</button>
        </div>
      </div>
    </div>
  );
}
