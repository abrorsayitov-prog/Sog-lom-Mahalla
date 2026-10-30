import { useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  Utensils,
  Pill as PillIcon,
  X,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Shell";
import { OverviewCharts } from "@/components/OverviewCharts";
import cover from "@/assets/patient-cover.jpg";
import food from "@/assets/healthy-food.jpg";

type Role = "admin" | "doctor" | "patient";
const people = [
  {
    name: "Karimova Dilshoda",
    specialty: "Terapevt",
    disease: "Shamollash",
    count: 48,
    tone: "danger",
    state: "Og‘ir",
    initials: "KD",
  },
  {
    name: "Raxmatov Sardor",
    specialty: "Kardiolog",
    disease: "Gipertoniya",
    count: 42,
    tone: "warning",
    state: "O‘rta",
    initials: "RS",
  },
  {
    name: "To‘xtayeva Mohira",
    specialty: "Endokrinolog",
    disease: "Qandli diabet",
    count: 36,
    tone: "success",
    state: "Yengil",
    initials: "TM",
  },
  {
    name: "Qodirov Bekzod",
    specialty: "Pediatr",
    disease: "Gastrit",
    count: 28,
    tone: "warning",
    state: "O‘rta",
    initials: "QB",
  },
  {
    name: "Jabborov Aziz",
    specialty: "Nevrolog",
    disease: "Osteoxondroz",
    count: 31,
    tone: "success",
    state: "Yengil",
    initials: "JA",
  },
  {
    name: "O‘rinov Muxtor",
    specialty: "Terapevt",
    disease: "Bronxit",
    count: 25,
    tone: "danger",
    state: "Og‘ir",
    initials: "OM",
  },
];
const taskRows = [
  { time: "08:00", title: "Nonushta", note: "Sut, tuxum, sabzavot", food: true },
  { time: "09:00", title: "Dori qabul qilish", note: "Amoksitsillin 500mg", food: false },
  { time: "13:00", title: "Tushlik", note: "To‘yimli taom, ko‘katlar", food: true },
  { time: "17:00", title: "Dori qabul qilish", note: "Vitamin D3", food: false },
  { time: "20:00", title: "Kechki ovqat", note: "Yengil taom", food: true },
];
const captions: Record<Role, { title: string; text: string; feature: string; device: string }> = {
  admin: {
    title: "Admin paneli",
    text: "Tizimni to‘liq boshqarish, shifokorlar va bemorlar ro‘yxatini ko‘rish, statistikani kuzatish va barcha jarayonlarni nazorat qilish.",
    feature: "Barcha ma’lumotlar bitta joyda",
    device: "Kompyuter uchun",
  },
  doctor: {
    title: "Shifokor paneli",
    text: "Bemorlarni qidirish, davolanish rejasi, kalendar va kunlik vazifalarni boshqarish. Bemor holatini doimiy kuzatish.",
    feature: "Qulay va tez boshqaruv",
    device: "Kompyuter va planshet",
  },
  patient: {
    title: "Bemor paneli",
    text: "Kundalik dori va ovqatlanish jadvali, eslatmalar, bajarilgan vazifalarni belgilash va shifokor bilan aloqa.",
    feature: "Sodda va tushunarli interfeys",
    device: "Telefon uchun",
  },
};

function Avatar({ initials, tone = "primary" }: { initials: string; tone?: string }) {
  return <span className={`concept-avatar avatar-${tone}`}>{initials}</span>;
}
function Badge({ children, tone = "success" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`concept-badge badge-${tone}`}>{children}</span>;
}
function MiniStat({
  icon: Icon,
  label,
  value,
  tone = "primary",
  change,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone?: string;
  change: string;
}) {
  return (
    <div className="mini-stat">
      <span className={`stat-symbol avatar-${tone}`}>
        <Icon size={16} />
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{change} ↑</small>
    </div>
  );
}

function PanelSidebar({
  role,
  active,
  onChange,
  onLogin,
}: {
  role: "admin" | "doctor";
  active: string;
  onChange: (v: string) => void;
  onLogin: () => void;
}) {
  const admin = role === "admin";
  const links = admin
    ? [
        { name: "Bosh sahifa", icon: Home },
        { name: "Shifokorlar", icon: Stethoscope },
        { name: "Bemorlar", icon: Users },
        { name: "Ro‘yxatga olish so‘rovlari", icon: ClipboardList },
        { name: "Statistika", icon: BarChart3 },
        { name: "Tizim sozlamalari", icon: Settings },
        { name: "Xabarlar", icon: MessageSquare },
      ]
    : [
        { name: "Bosh sahifa", icon: Home },
        { name: "Bemorlar", icon: Users },
        { name: "Kalendar", icon: CalendarDays },
        { name: "Davolanish rejasi", icon: ClipboardList },
        { name: "Hisobotlar", icon: BarChart3 },
        { name: "Xabarlar", icon: MessageSquare },
        { name: "Sozlamalar", icon: Settings },
      ];
  return (
    <aside className={`concept-sidebar ${admin ? "admin-sidebar" : "doctor-sidebar"}`}>
      <Logo light={admin} />
      <div className="sidebar-person">
        <Avatar initials={admin ? "A" : "DK"} />
        <div>
          <b>{admin ? "Admin" : "Dr. Dilshoda Karimova"}</b>
          <span>{admin ? "Administrator" : "Shifokor"}</span>
        </div>
      </div>
      <nav>
        {links.map(({ name, icon: Icon }) => (
          <Button
            variant="ghost"
            key={name}
            className={active === name ? "selected" : ""}
            onClick={() => onChange(name)}
          >
            <Icon />
            <span>{name}</span>
            {name === "Xabarlar" && <i>3</i>}
          </Button>
        ))}
      </nav>
      <Button variant="ghost" className="sidebar-exit" onClick={onLogin}>
        <LogOut />
        Chiqish
      </Button>
    </aside>
  );
}

function PeopleTable({
  doctor = false,
  query = "",
  onSelect,
}: {
  doctor?: boolean;
  query?: string;
  onSelect: (name: string) => void;
}) {
  const rows = people.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="concept-table-wrap">
      <table className="concept-table">
        <thead>
          <tr>
            <th>Ism Familiya</th>
            <th>{doctor ? "Telefon" : "Mutaxassislik"}</th>
            <th>{doctor ? "Kasallik" : "Bemorlar"}</th>
            <th>Holat</th>
            {doctor && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, doctor ? 6 : 4).map((p, i) => (
            <tr key={p.name}>
              <td>
                <Button variant="ghost" className="person-button" onClick={() => onSelect(p.name)}>
                  <Avatar initials={p.initials} tone={i % 2 ? "success" : "primary"} />
                  <span>{p.name}</span>
                </Button>
              </td>
              <td>{doctor ? `+998 90 123 45 ${67 + i}` : p.specialty}</td>
              <td>{doctor ? p.disease : p.count}</td>
              <td>
                <Badge tone={doctor ? p.tone : "success"}>{doctor ? p.state : "Faol"}</Badge>
              </td>
              {doctor && (
                <td>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Bemor ma’lumotlari"
                    onClick={() => onSelect(p.name)}
                  >
                    <MoreHorizontal />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="concept-empty">Bemor topilmadi</p>}
    </div>
  );
}

function CalendarBlock() {
  return (
    <section className="concept-section calendar-block">
      <div className="section-heading">
        <h3>
          <CalendarDays size={12} />
          Kalendar
        </h3>
        <span>Bugun</span>
      </div>
      <p>18 aprel 2025, Juma</p>
      <div className="calendar-week">
        {["Pa", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"].map((d, i) => (
          <div key={i}>
            <span>{d}</span>
            <b className={i === 4 ? "today" : ""}>{14 + i}</b>
          </div>
        ))}
      </div>
      <div className="appointments">
        {people.slice(0, 3).map((p, i) => (
          <div key={p.name}>
            <span>{["08:00", "10:00", "13:00"][i]}</span>
            <b>
              {p.name}
              <small>{i === 1 ? "Nazorat" : "Dori qabul qilish"}</small>
            </b>
            <Check size={12} />
          </div>
        ))}
      </div>
    </section>
  );
}

function DesktopPanel({ role, onLogin }: { role: "admin" | "doctor"; onLogin: () => void }) {
  const [active, setActive] = useState("Bosh sahifa");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<string | null>(null);
  const [notice, setNotice] = useState(false);
  const admin = role === "admin";
  const home = active === "Bosh sahifa";
  return (
    <div className={`concept-desktop ${admin ? "admin-concept" : "doctor-concept"}`}>
      <PanelSidebar role={role} active={active} onChange={setActive} onLogin={onLogin} />
      <div className="concept-workspace">
        <div className="concept-topbar">
          <label>
            <Search size={12} />
            <input
              aria-label={admin ? "Shifokor qidirish" : "Bemor qidirish"}
              placeholder={admin ? "Qidiruv..." : "Bemor qidirish..."}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value) setActive(admin ? "Shifokorlar" : "Bemorlar");
              }}
            />
          </label>
          <Button
            variant="ghost"
            size="icon"
            title="Bildirishnomalar"
            onClick={() => setNotice(!notice)}
          >
            <Bell />
            <i />
          </Button>
          <Avatar initials={admin ? "A" : "DK"} />
        </div>
        <div className="concept-content">
          {notice && (
            <div className="concept-notice">
              {admin ? "2 ta yangi shifokor so‘rovi" : "3 ta rejalashtirilgan qabul"}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Bildirishnomani yopish"
                onClick={() => setNotice(false)}
              >
                <X />
              </Button>
            </div>
          )}
          <div className="concept-title">
            <div>
              <h2>
                {home ? (admin ? "Boshqaruv paneli" : "Xush kelibsiz, Dr. Dilshoda") : active}
              </h2>
              <p>
                {admin
                  ? "Tizim holati va umumiy ma’lumotlar"
                  : "Bugungi kun bo‘yicha bemorlaringiz va vazifalar"}
              </p>
            </div>
            <span>
              18 aprel 2025 <CalendarDays size={11} />
            </span>
          </div>
          {home && (
            <>
              <div className={`mini-stats ${admin ? "four-stats" : "three-stats"}`}>
                <MiniStat
                  icon={Users}
                  label={admin ? "Bemorlar" : "Jami bemorlar"}
                  value={admin ? "2480" : "36"}
                  change={admin ? "+12% o‘tgan oy" : "+2 yangi"}
                />
                <MiniStat
                  icon={admin ? Stethoscope : Users}
                  label={admin ? "Shifokorlar" : "Faol davolanishlar"}
                  value={admin ? "48" : "32"}
                  tone="success"
                  change="+5% o‘tgan oy"
                />
                {admin && (
                  <MiniStat
                    icon={ClipboardList}
                    label="Faol davolanishlar"
                    value="623"
                    tone="warning"
                    change="+8% o‘tgan oy"
                  />
                )}
                <MiniStat
                  icon={Heart}
                  label="Tuzalganlar"
                  value={admin ? "1245" : "4"}
                  tone="success"
                  change="+1 o‘tgan oy"
                />
              </div>
              {admin ? (
                <OverviewCharts compact />
              ) : (
                <div className="severity-summary">
                  <Badge tone="danger">
                    ♥ &nbsp; Og‘ir <b>8</b>
                  </Badge>
                  <Badge tone="warning">
                    ◉ &nbsp; O‘rta <b>15</b>
                  </Badge>
                  <Badge>
                    ♡ &nbsp; Yengil <b>13</b>
                  </Badge>
                </div>
              )}
            </>
          )}
          {(home || active === "Bemorlar" || active === "Shifokorlar") && (
            <section className="concept-section">
              {!admin && (
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
              )}
              <div className="section-heading">
                <h3>
                  {admin
                    ? active === "Bemorlar"
                      ? "Bemorlar"
                      : "Shifokorlar"
                    : "Bemorlar ro‘yxati"}
                </h3>
                <Button
                  variant="link"
                  onClick={() => setActive(admin ? "Shifokorlar" : "Bemorlar")}
                >
                  {admin ? "Barcha shifokorlar" : "Barcha bemorlar"}
                  <ChevronRight />
                </Button>
              </div>
              <PeopleTable
                doctor={!admin || active === "Bemorlar"}
                query={query}
                onSelect={setDetail}
              />
            </section>
          )}
          {home &&
            (admin ? (
              <div className="concept-bottom-grid">
                <section className="concept-section">
                  <div className="section-heading">
                    <h3>So‘nggi voqealar</h3>
                    <Activity size={12} />
                  </div>
                  {[
                    "Yangi shifokor ro‘yxatdan o‘tdi",
                    "Bemor qo‘shildi",
                    "Davolanish yakunlandi",
                    "Yangi ariza",
                  ].map((text, i) => (
                    <div className="event-row" key={text}>
                      <span
                        className={`stat-symbol avatar-${["primary", "success", "warning", "danger"][i]}`}
                      >
                        <ClipboardList size={12} />
                      </span>
                      <div>
                        {text}
                        <small>{people[i]?.name}</small>
                      </div>
                      <time>{["10:24", "09:45", "08:32", "06:15"][i]}</time>
                    </div>
                  ))}
                </section>
                <section className="concept-section">
                  <div className="section-heading">
                    <h3>Tezkor amallar</h3>
                  </div>
                  {[
                    { text: "Shifokor qo‘shish", icon: Stethoscope },
                    { text: "Bemor qo‘shish", icon: Users },
                    { text: "Statistikani ko‘rish", icon: BarChart3 },
                    { text: "Sozlamalar", icon: Settings },
                  ].map(({ text, icon: Icon }) => (
                    <Button
                      key={text}
                      variant="secondary"
                      className="quick-action"
                      onClick={
                        text.includes("qo‘shish")
                          ? onLogin
                          : () =>
                              setActive(text.includes("Statistika") ? "Statistika" : "Sozlamalar")
                      }
                    >
                      <Icon />
                      {text}
                    </Button>
                  ))}
                </section>
              </div>
            ) : (
              <div className="concept-bottom-grid">
                <CalendarBlock />
                <section className="concept-section">
                  <div className="section-heading">
                    <h3>Tezkor ma’lumotlar</h3>
                  </div>
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
            ))}
          {!home && active === "Kalendar" && <CalendarBlock />}
          {!home && active === "Statistika" && <OverviewCharts compact />}
          {!home && active === "Ro‘yxatga olish so‘rovlari" && (
            <section className="concept-section">
              <h3>Yangi shifokor so‘rovlari</h3>
              {people.slice(0, 2).map((p) => (
                <div className="request-demo" key={p.name}>
                  <Avatar initials={p.initials} />
                  <b>{p.name}</b>
                  <Button size="sm" onClick={onLogin}>
                    Ko‘rish
                    <ChevronRight />
                  </Button>
                </div>
              ))}
            </section>
          )}
          {!home && active === "Davolanish rejasi" && (
            <section className="concept-section">
              <h3>Bugungi davolanish rejasi</h3>
              {taskRows.map((t) => (
                <div className="event-row" key={t.time}>
                  <PillIcon size={14} />
                  <div>
                    {t.title}
                    <small>{t.note}</small>
                  </div>
                  <time>{t.time}</time>
                </div>
              ))}
            </section>
          )}
          {!home && active === "Hisobotlar" && <OverviewCharts compact />}
          {!home && active === "Xabarlar" && (
            <section className="concept-section">
              <h3>Xabarlar</h3>
              {people.slice(0, 3).map((p) => (
                <div className="event-row" key={p.name}>
                  <Avatar initials={p.initials} />
                  <div>
                    {p.name}
                    <small>Bugungi qabul bo‘yicha</small>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Xabarni ochish"
                    onClick={() => setDetail(p.name)}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              ))}
            </section>
          )}
          {!home && (active === "Sozlamalar" || active === "Tizim sozlamalari") && (
            <section className="concept-section">
              <h3>Profil sozlamalari</h3>
              <div className="settings-demo">
                <Avatar initials={admin ? "A" : "DK"} />
                <b>{admin ? "Administrator" : "Dr. Dilshoda Karimova"}</b>
                <Button onClick={onLogin}>
                  Profilga kirish
                  <ArrowRight />
                </Button>
              </div>
            </section>
          )}
        </div>
      </div>
      {detail && (
        <div className="concept-detail">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ma’lumotni yopish"
            onClick={() => setDetail(null)}
          >
            <X />
          </Button>
          <Avatar
            initials={detail
              .split(" ")
              .map((n) => n[0])
              .join("")}
          />
          <h3>{detail}</h3>
          <p>{people.find((p) => p.name === detail)?.specialty}</p>
          <dl>
            <dt>Telefon</dt>
            <dd>+998 90 123 45 67</dd>
            <dt>Holat</dt>
            <dd>
              <Badge>Faol</Badge>
            </dd>
          </dl>
          <Button onClick={onLogin}>
            Panelga kirish
            <ArrowRight />
          </Button>
        </div>
      )}
    </div>
  );
}

function PatientConcept({ onLogin }: { onLogin: () => void }) {
  const [done, setDone] = useState([0, 1, 2]);
  const [active, setActive] = useState("home");
  const [notice, setNotice] = useState(false);
  return (
    <div className="concept-patient">
      <div className="patient-cover">
        <img
          src={cover}
          alt="Sog‘lom hayot uchun musaffo tog‘ manzarasi"
          width={1152}
          height={576}
        />
        <div className="phone-status">
          <b>9:41</b>
          <span>▮▮▮ &nbsp; ▰</span>
        </div>
        <div className="patient-brand">
          <Logo />
          <Button variant="ghost" size="icon" title="Eslatmalar" onClick={() => setNotice(!notice)}>
            <Bell />
          </Button>
          <Avatar initials="AK" />
        </div>
        <div className="patient-greeting">
          <p>Assalomu alaykum,</p>
          <h2>Azizbek Karimov</h2>
          <span>Sizning davolanish rejangiz</span>
        </div>
      </div>
      <div className="patient-concept-content">
        {notice && <div className="concept-notice">17:00 — Vitamin D3</div>}
        {active === "home" && (
          <section className="concept-section patient-progress">
            <div className="section-heading">
              <h3>
                <Activity size={12} />
                Bugungi holat
              </h3>
              <ChevronRight size={13} />
            </div>
            <div className="patient-progress-row">
              <div className="patient-ring">
                <svg viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="24" className="ring-track" />
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    className="ring-value"
                    strokeDasharray="150.8"
                    strokeDashoffset={150.8 * (1 - done.length / 5)}
                  />
                </svg>
                <b>{done.length}/5</b>
              </div>
              <span>Bajarilgan vazifalar</span>
              <Badge>{done.length === 5 ? "Ajoyib!" : "Yaxshi!"}</Badge>
            </div>
          </section>
        )}
        {(active === "home" || active === "plan") && (
          <>
            <section className="concept-section patient-plan">
              <div className="section-heading">
                <h3>
                  <span className="tiny-sun" />
                  Bugungi reja
                </h3>
                <span>18 aprel 2025, Juma</span>
              </div>
              {taskRows.map((t, i) => (
                <Button
                  variant="ghost"
                  className="patient-task"
                  key={t.time}
                  aria-pressed={done.includes(i)}
                  onClick={() =>
                    setDone(done.includes(i) ? done.filter((n) => n !== i) : [...done, i])
                  }
                >
                  <span
                    className={`task-symbol avatar-${done.includes(i) ? "success" : i === 2 ? "danger" : "primary"}`}
                  >
                    {t.food ? <Utensils size={11} /> : <PillIcon size={11} />}
                  </span>
                  <time>{t.time}</time>
                  <span className="task-copy">
                    <b>{t.title}</b>
                    <small>{t.note}</small>
                  </span>
                  <span className={`task-check ${done.includes(i) ? "checked" : ""}`}>
                    {done.includes(i) && <Check size={10} />}
                  </span>
                </Button>
              ))}
              <Button
                variant="link"
                className="all-tasks"
                onClick={() => setActive(active === "plan" ? "home" : "plan")}
              >
                {active === "plan" ? "Bosh sahifa" : "Barcha vazifalar"}
                <ArrowRight />
              </Button>
            </section>
            <section className="concept-section food-section">
              <div className="section-heading">
                <h3>
                  <Utensils size={12} />
                  Ovqatlanish rejasi
                </h3>
                <span>Bugun</span>
              </div>
              <div className="food-image">
                <img
                  src={food}
                  alt="Sut mahsulotlari, yangi sabzavotlar va mevalar"
                  loading="lazy"
                  width={1152}
                  height={576}
                />
              </div>
              <div className="food-labels">
                <span>Sut mahsulotlari</span>
                <span>Sabzavotlar</span>
                <span>Mevalar</span>
              </div>
            </section>
          </>
        )}
        {(active === "home" || active === "history") && (
          <section className="concept-section history-section">
            <div className="section-heading">
              <h3>Dori qabul qilish tarixi</h3>
              <span>So‘nggi 7 kun</span>
            </div>
            <div className="history-days">
              {[12, 13, 14, 15, 16, 17, 18].map((d) => (
                <div key={d}>
                  <span>
                    <Check size={10} />
                  </span>
                  <small>{d}.04</small>
                </div>
              ))}
            </div>
          </section>
        )}
        {active === "contact" && (
          <section className="concept-section contact-demo">
            <Avatar initials="DK" />
            <h3>Dr. Dilshoda Karimova</h3>
            <p>Terapevt</p>
            <Button onClick={onLogin}>
              Shifokor bilan aloqa
              <ArrowRight />
            </Button>
          </section>
        )}
        {active === "profile" && (
          <section className="concept-section contact-demo">
            <Avatar initials="AK" />
            <h3>Azizbek Karimov</h3>
            <p>Davolanish holati: yengil</p>
            <Button onClick={onLogin}>
              Profilga kirish
              <ArrowRight />
            </Button>
          </section>
        )}
      </div>
      <nav className="patient-bottom-nav">
        {[
          { key: "home", label: "Bosh sahifa", icon: Home },
          { key: "plan", label: "Reja", icon: ClipboardList },
          { key: "history", label: "Tarix", icon: CalendarDays },
          { key: "contact", label: "Aloqa", icon: MessageSquare },
          { key: "profile", label: "Profil", icon: UserRound },
        ].map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant="ghost"
            className={key === active ? "active" : ""}
            onClick={() => setActive(key)}
          >
            <Icon />
            <span>{label}</span>
          </Button>
        ))}
      </nav>
    </div>
  );
}

export function ConceptDashboard({ onLogin }: { onLogin: (role: Role) => void }) {
  return (
    <div className="concept-page">
      <header className="concept-page-header">
        <div>
          <Logo size="lg" />
          <p>Sizning sog‘lig‘ingiz — bizning g‘amxo‘rligimiz</p>
        </div>
        <h1>Birinchi qadam — sog‘lom hayot sari</h1>
        <div className="trust-pills">
          <span>
            <ShieldCheck />
            Ishonchli
          </span>
          <span>
            <Users />
            Qulay
          </span>
          <span>
            <Heart />
            Sog‘lom jamiyat
          </span>
        </div>
      </header>
      <main className="concept-grid">
        {(["admin", "doctor", "patient"] as const).map((role) => (
          <div className={`concept-column column-${role}`} key={role}>
            {role === "patient" ? (
              <PatientConcept onLogin={() => onLogin(role)} />
            ) : (
              <DesktopPanel role={role} onLogin={() => onLogin(role)} />
            )}
            <div className="panel-caption">
              <span className="caption-icon">
                {role === "admin" ? <ShieldCheck /> : role === "doctor" ? <Users /> : <UserRound />}
              </span>
              <div>
                <h2>{captions[role].title}</h2>
                <p>{captions[role].text}</p>
                <p className="caption-feature">
                  <Check size={9} />
                  {captions[role].feature}
                </p>
                <Button variant="link" onClick={() => onLogin(role)}>
                  Panelga kirish
                  <ArrowRight />
                </Button>
              </div>
              <span className="device-label">{captions[role].device}</span>
            </div>
          </div>
        ))}
      </main>
      <footer className="concept-page-footer">
        <span>
          <ShieldCheck size={13} />
          Sog‘lom Mahalla
        </span>
        <span>Ko‘rsatilgan ma’lumotlar — namunaviy</span>
      </footer>
    </div>
  );
}
