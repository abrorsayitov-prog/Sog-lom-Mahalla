import { Fragment } from "react";
import { ArrowRight, Bell, CalendarDays, LogOut, Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Shell";

export function Avatar({ initials, tone = "primary" }: { initials: string; tone?: string }) {
  return <span className={`concept-avatar avatar-${tone}`}>{initials}</span>;
}

export function Badge({
  children,
  tone = "success",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`concept-badge badge-${tone}`}>{children}</span>;
}

export function MiniStat({
  icon: Icon,
  label,
  value,
  tone = "primary",
  change,
}: {
  icon: LucideIcon;
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

export function SectionHeading({
  title,
  icon,
  action,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <h3>
        {icon}
        {title}
      </h3>
      {action}
    </div>
  );
}

export type NavItem = { name: string; icon: LucideIcon; badge?: string };

export function PanelSidebar({
  theme,
  person,
  links,
  active,
  onChange,
  onLogin,
}: {
  theme: "admin" | "doctor";
  person: { initials: string; name: string; role: string };
  links: NavItem[];
  active: string;
  onChange: (v: string) => void;
  onLogin: () => void;
}) {
  return (
    <aside className={`concept-sidebar ${theme}-sidebar`}>
      <Logo light={theme === "admin"} />
      <div className="sidebar-person">
        <Avatar initials={person.initials} />
        <div>
          <b>{person.name}</b>
          <span>{person.role}</span>
        </div>
      </div>
      <nav>
        {links.map(({ name, icon: Icon, badge }) => (
          <Button
            variant="ghost"
            key={name}
            className={active === name ? "selected" : ""}
            onClick={() => onChange(name)}
          >
            <Icon />
            <span>{name}</span>
            {badge && <i>{badge}</i>}
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

export function PanelTopBar({
  placeholder,
  ariaLabel,
  query,
  onQuery,
  initials,
  notice,
  onNotice,
}: {
  placeholder: string;
  ariaLabel: string;
  query: string;
  onQuery: (v: string) => void;
  initials: string;
  notice: boolean;
  onNotice: (v: boolean) => void;
}) {
  return (
    <div className="concept-topbar">
      <label>
        <Search size={12} />
        <input
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
      </label>
      <Button
        variant="ghost"
        size="icon"
        title="Bildirishnomalar"
        onClick={() => onNotice(!notice)}
      >
        <Bell />
        <i />
      </Button>
      <Avatar initials={initials} />
    </div>
  );
}

export function PanelNotice({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="concept-notice">
      {text}
      <Button variant="ghost" size="icon" aria-label="Bildirishnomani yopish" onClick={onClose}>
        <X />
      </Button>
    </div>
  );
}

export function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="concept-title">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <span>
        18 aprel 2025 <CalendarDays size={11} />
      </span>
    </div>
  );
}

export function DetailCard({
  initials,
  title,
  subtitle,
  rows,
  onLogin,
  onClose,
}: {
  initials: string;
  title: string;
  subtitle: string;
  rows: [string, React.ReactNode][];
  onLogin: () => void;
  onClose: () => void;
}) {
  return (
    <div className="concept-detail">
      <Button variant="ghost" size="icon" aria-label="Ma’lumotni yopish" onClick={onClose}>
        <X />
      </Button>
      <Avatar initials={initials} />
      <h3>{title}</h3>
      <p>{subtitle}</p>
      <dl>
        {rows.map(([label, value]) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </dl>
      <Button onClick={onLogin}>
        Panelga kirish
        <ArrowRight />
      </Button>
    </div>
  );
}
