import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Heart,
  Home,
  MessageSquare,
  Pill as PillIcon,
  Search,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OverviewCharts } from "@/components/OverviewCharts";
import {
  doctorAppointments,
  doctorChartAxis,
  doctorChartStats,
  doctorMessages,
  doctorPatients,
  doctorTasks,
  severityRows,
} from "./data";
import { PatientsTable } from "./tables";
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
  { name: "Bemorlar", icon: Users },
  { name: "Kalendar", icon: CalendarDays },
  { name: "Davolanish rejasi", icon: ClipboardList },
  { name: "Hisobotlar", icon: BarChart3 },
  { name: "Xabarlar", icon: MessageSquare, badge: "3" },
  { name: "Sozlamalar", icon: Settings },
];

const subtitles: Record<string, string> = {
  "Bosh sahifa": "Bugungi kun bo‘yicha bemorlaringiz va vazifalar",
  Bemorlar: "O‘zingiz kuzatayotgan bemorlar ro‘yxati",
  Kalendar: "Bugungi va kelgasi qabullar jadvali",
  "Davolanish rejasi": "Bemorlar bo‘yicha kunlik vazifalar",
  Hisobotlar: "Bemorlar soni va davolanish ko‘rsatkichlari",
  Xabarlar: "Bemorlardan kelgan xabarlar",
  Sozlamalar: "Shaxsiy profil va parol boshqaruvi",
};

function CalendarBlock() {
  return (
    <section className="concept-section calendar-block">
      <SectionHeading
        title="Kalendar"
        icon={<CalendarDays size={12} />}
        action={<span>Bugun</span>}
      />
      <p>18 aprel 2025, Juma</p>
      <div className="calendar-week">
        {["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"].map((d, i) => (
          <div key={d}>
            <span>{d}</span>
            <b className={i === 4 ? "today" : ""}>{14 + i}</b>
          </div>
        ))}
      </div>
      <div className="appointments">
        {doctorAppointments.slice(0, 3).map((a) => (
          <div key={a.time}>
            <span>{a.time}</span>
            <b>
              {a.name}
              <small>{a.note}</small>
            </b>
            <Check size={12} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function DoctorPanel({ onLogin }: { onLogin: () => void }) {
  const [active, setActive] = useState("Bosh sahifa");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<string | null>(null);
  const [notice, setNotice] = useState(false);
  const home = active === "Bosh sahifa";
  const rows = doctorPatients.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  const patient = doctorPatients.find((p) => p.name === detail);

  return (
    <div className="concept-desktop doctor-concept">
      <PanelSidebar
        theme="doctor"
        person={{ initials: "DK", name: "Dr. Dilshoda Karimova", role: "Shifokor" }}
        links={links}
        active={active}
        onChange={setActive}
        onLogin={onLogin}
      />
      <div className="concept-workspace">
        <PanelTopBar
          placeholder="Bemor qidirish..."
          ariaLabel="Bemor qidirish"
          query={query}
          onQuery={(v) => {
            setQuery(v);
            if (v) setActive("Bemorlar");
          }}
          initials="DK"
          notice={notice}
          onNotice={setNotice}
        />
        <div className="concept-content">
          {notice && (
            <PanelNotice text="3 ta rejalashtirilgan qabul" onClose={() => setNotice(false)} />
          )}
          <PanelTitle
            title={home ? "Xush kelibsiz, Dr. Dilshoda" : active}
            subtitle={subtitles[active] ?? "Bugungi kun bo‘yicha bemorlaringiz va vazifalar"}
          />

          {home && (
            <>
              <div className="mini-stats three-stats">
                <MiniStat icon={Users} label="Jami bemorlar" value="36" change="+2 yangi" />
                <MiniStat
                  icon={Stethoscope}
                  label="Faol davolanishlar"
                  value="32"
                  tone="success"
                  change="+1 o‘tgan oy"
                />
                <MiniStat
                  icon={Heart}
                  label="Tuzalganlar"
                  value="4"
                  tone="success"
                  change="+1 o‘tgan oy"
                />
              </div>
              <div className="severity-summary">
                {severityRows.map((s) => (
                  <Badge key={s.label} tone={s.tone}>
                    {s.icon} &nbsp; {s.label} <b>{s.value}</b>
                  </Badge>
                ))}
              </div>
            </>
          )}

          {(home || active === "Bemorlar") && (
            <section className="concept-section">
              <div className="table-search">
                <Search size={12} />
                <input
                  placeholder="Bemor qidirish (ism, telefon, ID)"
                  aria-label="Ro‘yxatdan qidirish"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button size="icon" title="Qidirish">
                  <Search />
                </Button>
              </div>
              <SectionHeading
                title="Bemorlar ro‘yxati"
                action={
                  <Button variant="link" onClick={() => setActive("Bemorlar")}>
                    Barcha bemorlar
                    <ChevronRight />
                  </Button>
                }
              />
              <PatientsTable rows={home ? rows.slice(0, 6) : rows} onSelect={setDetail} />
            </section>
          )}

          {home && (
            <div className="concept-bottom-grid">
              <CalendarBlock />
              <section className="concept-section">
                <SectionHeading title="Tezkor ma’lumotlar" />
                <div className="compliance-ring">
                  <b>67%</b>
                </div>
                <p className="compliance-label">Bemorlar rioyati</p>
                {[
                  ["Bugun bajarilgan", "21"],
                  ["Bajarilmagan", "8"],
                  ["Kutilayotgan", "7"],
                ].map(([label, value], i) => (
                  <div className="compliance-row" key={label}>
                    <i className={`bg-${["success", "destructive", "primary"][i]}`} />
                    {label}
                    <b>{value}</b>
                  </div>
                ))}
                <Button className="all-patients" onClick={() => setActive("Bemorlar")}>
                  Barcha bemorlar
                  <ArrowRight />
                </Button>
              </section>
            </div>
          )}

          {!home && active === "Kalendar" && <CalendarBlock />}

          {!home && active === "Davolanish rejasi" && (
            <section className="concept-section">
              <SectionHeading
                title="Bugungi davolanish rejasi"
                icon={<ClipboardList size={12} />}
              />
              {doctorTasks.map((t) => (
                <div className="event-row" key={t.time}>
                  <span className="stat-symbol avatar-primary">
                    {t.pill ? <PillIcon size={12} /> : <CalendarDays size={12} />}
                  </span>
                  <div>
                    {t.title}
                    <small>{t.note}</small>
                  </div>
                  <time>{t.time}</time>
                </div>
              ))}
            </section>
          )}

          {!home && active === "Hisobotlar" && (
            <OverviewCharts compact stats={doctorChartStats} axisMax={doctorChartAxis} />
          )}

          {!home && active === "Xabarlar" && (
            <section className="concept-section">
              <SectionHeading title="Bemorlardan xabarlar" icon={<MessageSquare size={12} />} />
              {doctorMessages.map((m) => (
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

          {!home && active === "Sozlamalar" && (
            <section className="concept-section">
              <SectionHeading title="Profil sozlamalari" icon={<Settings size={12} />} />
              <div className="settings-demo">
                <Avatar initials="DK" />
                <b>Dr. Dilshoda Karimova</b>
                <span>Terapevt · 12-poliklinika</span>
                <Button onClick={onLogin}>
                  Profilga kirish
                  <ArrowRight />
                </Button>
              </div>
            </section>
          )}
        </div>
      </div>
      {detail && patient && (
        <DetailCard
          initials={patient.initials}
          title={patient.name}
          subtitle={patient.disease}
          rows={[
            ["Telefon", patient.phone],
            [
              "Holat",
              <Badge key="s" tone={patient.tone}>
                {patient.state}
              </Badge>,
            ],
          ]}
          onLogin={onLogin}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
