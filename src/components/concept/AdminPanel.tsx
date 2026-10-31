import { useState } from "react";
import {
  Activity,
  BarChart3,
  ChevronRight,
  ClipboardList,
  Heart,
  Home,
  MessageSquare,
  Plus,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OverviewCharts } from "@/components/OverviewCharts";
import {
  adminChartAxis,
  adminChartStats,
  adminDoctors,
  adminEvents,
  adminMessages,
  adminPatients,
  adminRequests,
} from "./data";
import { AdminPatientsTable, DoctorsTable } from "./tables";
import {
  Avatar,
  Badge,
  DetailCard,
  MiniStat,
  PanelNotice,
  PanelSidebar,
  PanelTitle,
  PanelTopBar,
  SectionHeading,
} from "./ui";
import type { NavItem } from "./ui";

const links: NavItem[] = [
  { name: "Bosh sahifa", icon: Home },
  { name: "Shifokorlar", icon: Stethoscope },
  { name: "Bemorlar", icon: Users },
  { name: "Ro‘yxatga olish so‘rovlari", icon: ClipboardList },
  { name: "Statistika", icon: BarChart3 },
  { name: "Tizim sozlamalari", icon: Settings },
  { name: "Xabarlar", icon: MessageSquare, badge: "3" },
];

const subtitles: Record<string, string> = {
  "Bosh sahifa": "Tizim holati va umumiy ma’lumotlar",
  Shifokorlar: "Platformadagi barcha shifokorlar va ularning yuklamasi",
  Bemorlar: "Barcha bemorlar, kasalliklari va kuzatuvchi shifokorlari",
  "Ro‘yxatga olish so‘rovlari": "Tasdiq kutayotgan yangi shifokorlar",
  Statistika: "Bemorlar soni va og‘irlik bo‘yicha taqsimoti",
  "Tizim sozlamalari": "Platforma parametrlari va xavfsizlik",
  Xabarlar: "Shifokorlardan kelgan xabarlar",
};

export function AdminPanel({ onLogin }: { onLogin: () => void }) {
  const [active, setActive] = useState("Bosh sahifa");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<string | null>(null);
  const [notice, setNotice] = useState(false);
  const home = active === "Bosh sahifa";
  const doctors = adminDoctors.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));
  const patients = adminPatients.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  const doctorDetail = adminDoctors.find((d) => d.name === detail);
  const patientDetail = adminPatients.find((p) => p.name === detail);

  return (
    <div className="concept-desktop admin-concept">
      <PanelSidebar
        theme="admin"
        person={{ initials: "A", name: "Admin", role: "Administrator" }}
        links={links}
        active={active}
        onChange={setActive}
        onLogin={onLogin}
      />
      <div className="concept-workspace">
        <PanelTopBar
          placeholder="Qidiruv..."
          ariaLabel="Shifokor yoki bemor qidirish"
          query={query}
          onQuery={(v) => {
            setQuery(v);
            if (v) setActive("Bemorlar");
          }}
          initials="A"
          notice={notice}
          onNotice={setNotice}
        />
        <div className="concept-content">
          {notice && (
            <PanelNotice text="2 ta yangi shifokor so‘rovi" onClose={() => setNotice(false)} />
          )}
          <PanelTitle
            title={home ? "Boshqaruv paneli" : active}
            subtitle={subtitles[active] ?? "Tizim holati va umumiy ma’lumotlar"}
          />

          {home && (
            <>
              <div className="mini-stats four-stats">
                <MiniStat icon={Users} label="Bemorlar" value="2480" change="+12% o‘tgan oy" />
                <MiniStat
                  icon={Stethoscope}
                  label="Shifokorlar"
                  value="48"
                  tone="success"
                  change="+5% o‘tgan oy"
                />
                <MiniStat
                  icon={ClipboardList}
                  label="Faol davolanishlar"
                  value="623"
                  tone="warning"
                  change="+8% o‘tgan oy"
                />
                <MiniStat
                  icon={Heart}
                  label="Tuzalganlar"
                  value="1245"
                  tone="success"
                  change="+1 o‘tgan oy"
                />
              </div>
              <OverviewCharts compact stats={adminChartStats} axisMax={adminChartAxis} />
              <section className="concept-section">
                <SectionHeading
                  title="Shifokorlar"
                  action={
                    <Button variant="link" onClick={() => setActive("Shifokorlar")}>
                      Barcha shifokorlar
                      <ChevronRight />
                    </Button>
                  }
                />
                <DoctorsTable rows={doctors.slice(0, 4)} onSelect={setDetail} />
              </section>
              <div className="concept-bottom-grid">
                <section className="concept-section">
                  <SectionHeading title="So‘nggi voqealar" icon={<Activity size={12} />} />
                  {adminEvents.map((e, i) => (
                    <div className="event-row" key={e.text}>
                      <span
                        className={`stat-symbol avatar-${["primary", "success", "warning", "danger"][i]}`}
                      >
                        <ClipboardList size={12} />
                      </span>
                      <div>
                        {e.text}
                        <small>{e.who}</small>
                      </div>
                      <time>{e.time}</time>
                    </div>
                  ))}
                </section>
                <section className="concept-section">
                  <SectionHeading title="Tezkor amallar" />
                  <Button variant="secondary" className="quick-action" onClick={onLogin}>
                    <Plus />
                    Shifokor qo‘shish
                  </Button>
                  <Button variant="secondary" className="quick-action" onClick={onLogin}>
                    <Plus />
                    Bemor qo‘shish
                  </Button>
                  <Button
                    variant="secondary"
                    className="quick-action"
                    onClick={() => setActive("Statistika")}
                  >
                    <BarChart3 />
                    Statistikani ko‘rish
                  </Button>
                  <Button
                    variant="secondary"
                    className="quick-action"
                    onClick={() => setActive("Tizim sozlamalari")}
                  >
                    <Settings />
                    Tizim sozlamalari
                  </Button>
                </section>
              </div>
            </>
          )}

          {!home && active === "Shifokorlar" && (
            <section className="concept-section">
              <SectionHeading
                title="Platformadagi shifokorlar"
                action={<Badge>{`${doctors.length} ta`}</Badge>}
              />
              <DoctorsTable rows={doctors} onSelect={setDetail} />
            </section>
          )}

          {!home && active === "Bemorlar" && (
            <section className="concept-section">
              <SectionHeading
                title="Barcha bemorlar"
                action={<Badge>{`${patients.length} ta`}</Badge>}
              />
              <AdminPatientsTable rows={patients} onSelect={setDetail} />
            </section>
          )}

          {!home && active === "Ro‘yxatga olish so‘rovlari" && (
            <section className="concept-section">
              <SectionHeading title="Yangi shifokor so‘rovlari" icon={<Stethoscope size={12} />} />
              {adminRequests.map((r) => (
                <div className="request-demo" key={r.name}>
                  <Avatar initials={r.initials} tone="warning" />
                  <b>
                    {r.name}
                    <small>
                      {r.specialty} · {r.when}
                    </small>
                  </b>
                  <Button size="sm" onClick={onLogin}>
                    Tasdiqlash
                    <ChevronRight />
                  </Button>
                </div>
              ))}
            </section>
          )}

          {!home && active === "Statistika" && (
            <OverviewCharts compact stats={adminChartStats} axisMax={adminChartAxis} />
          )}

          {!home && active === "Xabarlar" && (
            <section className="concept-section">
              <SectionHeading title="Shifokorlardan xabarlar" icon={<MessageSquare size={12} />} />
              {adminMessages.map((m) => (
                <div className="event-row" key={m.name}>
                  <Avatar initials={m.initials} />
                  <div>
                    {m.name}
                    <small>{m.note}</small>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Xabarni ochish"
                    onClick={() => setDetail(m.name)}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              ))}
            </section>
          )}

          {!home && active === "Tizim sozlamalari" && (
            <section className="concept-section">
              <SectionHeading title="Tizim sozlamalari" icon={<Settings size={12} />} />
              {[
                ["Platforma nomi", "Sog‘lom Mahalla"],
                ["Interfeys tili", "O‘zbekcha"],
                ["Qo‘llab-quvvatlash", "support@soglommahalla.uz"],
                ["Zaxira nusxa", "Har kuni 03:00"],
              ].map(([label, value]) => (
                <div className="setting-row" key={label}>
                  <span>{label}</span>
                  <b>{value}</b>
                </div>
              ))}
              <Button className="all-patients" onClick={onLogin}>
                Sozlamalarga kirish
                <ChevronRight />
              </Button>
            </section>
          )}
        </div>
      </div>
      {detail && (doctorDetail || patientDetail) && (
        <DetailCard
          initials={(doctorDetail ?? patientDetail)?.initials ?? ""}
          title={detail}
          subtitle={doctorDetail ? doctorDetail.specialty : (patientDetail?.disease ?? "")}
          rows={
            doctorDetail
              ? [
                  ["Kuzatuvdagi bemorlar", String(doctorDetail.patients)],
                  ["Holat", <Badge key="s">{doctorDetail.state}</Badge>],
                ]
              : [
                  ["Kuzatuvchi shifokor", patientDetail?.doctor ?? "—"],
                  [
                    "Holat",
                    <Badge key="s" tone={patientDetail?.tone ?? "success"}>
                      {patientDetail?.state}
                    </Badge>,
                  ],
                ]
          }
          onLogin={onLogin}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
