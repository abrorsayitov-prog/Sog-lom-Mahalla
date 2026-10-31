import { useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Home,
  MessageSquare,
  Pill as PillIcon,
  Utensils,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Shell";
import cover from "@/assets/patient-cover.jpg";
import food from "@/assets/healthy-food.jpg";
import { patientTasks } from "./data";
import { Avatar, Badge, SectionHeading } from "./ui";

const nav = [
  { key: "home", label: "Bosh sahifa", icon: Home },
  { key: "plan", label: "Reja", icon: ClipboardList },
  { key: "history", label: "Tarix", icon: CalendarDays },
  { key: "contact", label: "Aloqa", icon: MessageSquare },
  { key: "profile", label: "Profil", icon: UserRound },
];

export function PatientPanel({ onLogin }: { onLogin: () => void }) {
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
            <SectionHeading
              title="Bugungi holat"
              icon={<Activity size={12} />}
              action={<ChevronRight size={13} />}
            />
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
              {patientTasks.map((t, i) => (
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
              <SectionHeading
                title="Ovqatlanish rejasi"
                icon={<Utensils size={12} />}
                action={<span>Bugun</span>}
              />
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
            <SectionHeading title="Dori qabul qilish tarixi" action={<span>So‘nggi 7 kun</span>} />
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
        {nav.map(({ key, label, icon: Icon }) => (
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
