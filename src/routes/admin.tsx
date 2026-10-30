import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, AlertTriangle, Check, Home, Stethoscope, Trash2, UserPlus, Users, X } from "lucide-react";
import { Empty, PageTitle, Pill, Shell, Stat, useGuard } from "@/components/Shell";
import { actions, progress, severityLabel, useStore, type DoctorStatus } from "@/lib/store";
import { OverviewCharts } from "@/components/OverviewCharts";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin paneli — Sog‘lom Mahalla" },
      { name: "description", content: "Shifokorlar, bemorlar va platforma holatini boshqarish." },
      { property: "og:title", content: "Admin paneli — Sog‘lom Mahalla" },
      { property: "og:description", content: "Platformani to‘liq boshqarish paneli." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

const statusPill: Record<DoctorStatus, { tone: "success" | "warning" | "danger"; label: string }> = {
  approved: { tone: "success", label: "Faol" },
  pending: { tone: "warning", label: "Kutilmoqda" },
  rejected: { tone: "danger", label: "Rad etilgan" },
};

function Admin() {
  const { doctors, patients } = useStore();
  const [tab, setTab] = useState("home");
  const session = useGuard("admin");
  if (!session) return null;

  const pending = doctors.filter((d) => d.status === "pending");
  const alerts = patients.filter((p) => progress(p).missed.length > 0);
  const docName = (id: string) => { const d = doctors.find((x) => x.id === id); return d ? `${d.firstName} ${d.lastName}` : "—"; };

  return (
    <Shell user="Admin" role="Administrator" active={tab} onNav={setTab}
      nav={[
        { key: "home", label: "Bosh sahifa", icon: Home },
        { key: "requests", label: "So‘rovlar", icon: UserPlus, badge: pending.length },
        { key: "doctors", label: "Shifokorlar", icon: Stethoscope },
        { key: "patients", label: "Bemorlar", icon: Users },
      ]}>
      {tab === "home" && (
        <>
          <PageTitle title="Boshqaruv paneli" sub="Tizim holati va umumiy ma’lumotlar" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat icon={Users} label="Bemorlar" value={patients.length} />
            <Stat icon={Stethoscope} label="Faol shifokorlar" value={doctors.filter((d) => d.status === "approved").length} tone="success" />
            <Stat icon={UserPlus} label="Yangi so‘rovlar" value={pending.length} tone="warning" />
            <Stat icon={AlertTriangle} label="Ogohlantirishlar" value={alerts.length} tone="danger" />
          </div>
          <OverviewCharts />
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="card-soft p-5">
              <h3 className="font-semibold">Kutilayotgan shifokorlar</h3>
              <div className="mt-4 space-y-2">
                {pending.length === 0 && <Empty>Yangi so‘rov yo‘q</Empty>}
                {pending.slice(0, 5).map((d) => <RequestRow key={d.id} d={d} />)}
              </div>
            </section>
            <section className="card-soft p-5">
              <h3 className="flex items-center gap-2 font-semibold"><Activity className="h-4 w-4 text-destructive" /> Vazifani o‘tkazib yuborganlar</h3>
              <div className="mt-4 space-y-2">
                {alerts.length === 0 && <Empty>Hamma bemorlar o‘z vaqtida</Empty>}
                {alerts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-danger-soft p-3 text-sm">
                    <div><div className="font-semibold">{p.firstName} {p.lastName}</div><div className="text-xs text-muted-foreground">{p.phone} · Dr. {docName(p.doctorId)}</div></div>
                    <Pill tone="danger">{progress(p).missed.length} ta</Pill>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}

      {tab === "requests" && (
        <>
          <PageTitle title="Shifokor so‘rovlari" sub="Login orqali kirgan shifokorlarni tasdiqlang" />
          <div className="space-y-2">
            {pending.length === 0 && <Empty>Yangi so‘rov yo‘q</Empty>}
            {pending.map((d) => <RequestRow key={d.id} d={d} />)}
          </div>
        </>
      )}

      {tab === "doctors" && (
        <>
          <PageTitle title="Shifokorlar" sub={`Jami: ${doctors.length}`} />
          <div className="card-soft overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs text-muted-foreground">
                <tr><th className="p-3">Ism Familiya</th><th className="p-3">Telefon</th><th className="p-3">Mutaxassislik</th><th className="p-3">Bemorlar</th><th className="p-3">Holat</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {doctors.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Shifokorlar yo‘q</td></tr>}
                {doctors.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="p-3 font-medium">{d.firstName} {d.lastName}</td>
                    <td className="p-3">{d.phone}</td>
                    <td className="p-3"><input className="field h-9" value={d.specialty} onChange={(e) => actions.updateDoctor(d.id, { specialty: e.target.value })} /></td>
                    <td className="p-3">{patients.filter((p) => p.doctorId === d.id).length}</td>
                    <td className="p-3"><Pill tone={statusPill[d.status].tone}>{statusPill[d.status].label}</Pill></td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        {d.status !== "approved" && <button className="btn btn-ghost h-8 px-2" title="Faollashtirish" onClick={() => actions.setDoctorStatus(d.id, "approved")}><Check className="h-4 w-4" /></button>}
                        {d.status === "approved" && <button className="btn btn-ghost h-8 px-2" title="Bloklash" onClick={() => actions.setDoctorStatus(d.id, "rejected")}><X className="h-4 w-4" /></button>}
                        <button className="btn btn-ghost h-8 px-2 text-destructive" onClick={() => confirm("O‘chirilsinmi?") && actions.deleteDoctor(d.id)}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "patients" && (
        <>
          <PageTitle title="Barcha bemorlar" sub={`Jami: ${patients.length}`} />
          <div className="card-soft overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs text-muted-foreground">
                <tr><th className="p-3">Bemor</th><th className="p-3">Telefon</th><th className="p-3">Tashxis</th><th className="p-3">Shifokor</th><th className="p-3">Bugun</th><th className="p-3">Holat</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {patients.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Bemorlar yo‘q</td></tr>}
                {patients.map((p) => { const pr = progress(p); return (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 font-medium">{p.firstName} {p.lastName}</td>
                    <td className="p-3">{p.phone}</td>
                    <td className="p-3">{p.diagnosis}</td>
                    <td className="p-3">{docName(p.doctorId)}</td>
                    <td className="p-3">{pr.done}/{pr.total}</td>
                    <td className="p-3"><Pill tone={p.severity === "ogir" ? "danger" : p.severity === "orta" ? "warning" : "success"}>{severityLabel[p.severity]}</Pill></td>
                    <td className="p-3 text-right"><button className="btn btn-ghost h-8 px-2 text-destructive" onClick={() => confirm("O‘chirilsinmi?") && actions.deletePatient(p.id)}><Trash2 className="h-4 w-4" /></button></td>
                  </tr>); })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Shell>
  );
}

function RequestRow({ d }: { d: { id: string; firstName: string; lastName: string; phone: string; createdAt: string } }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
      <div>
        <div className="font-semibold">{d.firstName} {d.lastName}</div>
        <div className="text-xs text-muted-foreground">{d.phone} · {new Date(d.createdAt).toLocaleString("uz-UZ")}</div>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary h-9" onClick={() => actions.setDoctorStatus(d.id, "approved")}><Check className="h-4 w-4" /> Tasdiqlash</button>
        <button className="btn btn-ghost h-9" onClick={() => actions.setDoctorStatus(d.id, "rejected")}><X className="h-4 w-4" /> Rad etish</button>
      </div>
    </div>
  );
}
