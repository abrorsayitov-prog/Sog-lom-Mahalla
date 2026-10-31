import { ArrowRight, Check, Heart, ShieldCheck, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Shell";
import { AdminPanel } from "./AdminPanel";
import { DoctorPanel } from "./DoctorPanel";
import { PatientPanel } from "./PatientPanel";

type Role = "admin" | "doctor" | "patient";

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

const icons: Record<Role, typeof Users> = {
  admin: ShieldCheck,
  doctor: Users,
  patient: UserRound,
};

export function ConceptPage({ onLogin }: { onLogin: (role: Role) => void }) {
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
        {(["admin", "doctor", "patient"] as const).map((role) => {
          const Icon = icons[role];
          return (
            <div className={`concept-column column-${role}`} key={role}>
              <div className="panel-frame">
                {role === "admin" ? (
                  <AdminPanel onLogin={() => onLogin(role)} />
                ) : role === "doctor" ? (
                  <DoctorPanel onLogin={() => onLogin(role)} />
                ) : (
                  <PatientPanel onLogin={() => onLogin(role)} />
                )}
              </div>
              <p className="swipe-hint">Panelni to‘liq ko‘rish uchun barmog‘ingiz bilan suring →</p>
              <div className="panel-caption">
                <span className="caption-icon">
                  <Icon />
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
          );
        })}
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
