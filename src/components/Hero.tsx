import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Doctor, Patient } from "@/lib/api";

/** Hero ustidagi shisha chips: plakat va tungi fonlarda bir xil o'qiladi. */
export function HeroChip({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="glass flex items-center gap-3 p-3.5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/20">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-base opacity-80">{label}</span>
        <span className="block text-3xl font-extrabold leading-tight">{value}</span>
      </span>
    </div>
  );
}

const HEART_PATH =
  "M80 142C80 142 18 104 18 62 18 38 36 20 58 20 69 20 77 25 80 33 83 25 91 20 102 20 124 20 142 38 142 62 142 104 80 142 80 142Z";
const CROSS_PATH = "M74 52H86V70H104V82H86V100H74V82H56V70H74Z";

/** Yaltiroq 3D yurak + tibbiy xoch: shifokor paneli boshi uchun. */
export function GlossyHeart({ className }: { className?: string }) {
  const raw = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`hb-${raw}`} x1="0.12" y1="0" x2="0.88" y2="1">
          <stop offset="0%" stopColor="#cfe9ff" />
          <stop offset="30%" stopColor="#4d92ff" />
          <stop offset="66%" stopColor="#1a4fd0" />
          <stop offset="100%" stopColor="#0c2678" />
        </linearGradient>
        <radialGradient id={`hg-${raw}`} cx="0.3" cy="0.22" r="0.42">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={`hs-${raw}`} x="-45%" y="-45%" width="190%" height="190%">
          <feDropShadow dx="0" dy="16" stdDeviation="15" floodColor="#081a4d" floodOpacity="0.6" />
        </filter>
      </defs>
      <g filter={`url(#hs-${raw})`}>
        <path d={HEART_PATH} fill={`url(#hb-${raw})`} />
        <path d={HEART_PATH} fill={`url(#hg-${raw})`} />
        <path d={CROSS_PATH} fill="#ffffff" fillOpacity="0.94" />
      </g>
    </svg>
  );
}

/** Kichik oq xoch — plakat ustidagi suzuvchi bezak. */
export function TinyCross({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d="M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8z" fill="currentColor" />
    </svg>
  );
}

/** Qo'llar tutgan yurak emblemasi: bemor paneli uchun issiq belgi. */
export function CareEmblem({ className }: { className?: string }) {
  const raw = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`er-${raw}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4dc9a" />
          <stop offset="55%" stopColor="#dfae55" />
          <stop offset="100%" stopColor="#b98a34" />
        </linearGradient>
        <linearGradient id={`eh-${raw}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#4f8fd6" />
          <stop offset="60%" stopColor="#1c4f97" />
          <stop offset="100%" stopColor="#0e2f62" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="80" r="72" fill="none" stroke={`url(#er-${raw})`} strokeWidth="5" />
      <circle cx="80" cy="80" r="62" fill="#ffffff" fillOpacity="0.55" />
      <g transform="translate(28 20) scale(0.65)">
        <path d={HEART_PATH} fill={`url(#eh-${raw})`} />
        <path d={CROSS_PATH} fill="#ffffff" fillOpacity="0.9" />
      </g>
      <g fill="none" stroke="#123a75" strokeWidth="11" strokeLinecap="round">
        <path d="M26 104c0 22 16 38 38 38" />
        <path d="M134 104c0 22-16 38-38 38" />
      </g>
    </svg>
  );
}

/** Yurak urishi chizig'i — admin logotipi. */
export function PulseMark({ className }: { className?: string }) {
  const raw = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 96 34" className={className} aria-hidden="true" focusable="false">
      <defs>
        <filter id={`pg-${raw}`} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M2 17h14l5-12 8 24 5-16 4 6h20"
        fill="none"
        stroke="#8b7bff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#pg-${raw})`}
      />
      <path d="M58 17h30" fill="none" stroke="#6ee7ff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type NetNode = {
  key: string;
  initials: string;
  x: number;
  y: number;
  patients: number;
  tone: "violet" | "gold" | "red";
};

const TONE = {
  violet: { ring: "#8b7bff", dot: "#6ee7ff" },
  gold: { ring: "#f0c26a", dot: "#f7e2b0" },
  red: { ring: "#ff6b7d", dot: "#ffb3bd" },
} as const;

/**
 * Haqiqiy ma'lumotdan quriladigan tarmoq: platforma markazi, shifokor tugunlari
 * va ularning bemor nuqtalari.
 */
export function DoctorNetwork({
  doctors,
  patients,
  alertDoctorIds,
  className,
}: {
  doctors: Doctor[];
  patients: Patient[];
  alertDoctorIds: string[];
  className?: string;
}) {
  const raw = useId().replace(/:/g, "");
  const cx = 320;
  const cy = 148;
  const shown = doctors.slice(0, 6);

  const nodes: NetNode[] = shown.map((doctor, index) => {
    const angle =
      shown.length === 1 ? -Math.PI / 2 : -Math.PI / 2 + (index / shown.length) * Math.PI * 2;
    return {
      key: doctor.id,
      initials: `${doctor.firstName.charAt(0)}${doctor.lastName.charAt(0)}`.toUpperCase(),
      x: cx + 205 * Math.cos(angle),
      y: cy + 92 * Math.sin(angle),
      patients: patients.filter((patient) => patient.doctorId === doctor.id).length,
      tone:
        doctor.status === "pending"
          ? "gold"
          : alertDoctorIds.includes(doctor.id)
            ? "red"
            : "violet",
    };
  });

  return (
    <svg viewBox="0 0 640 296" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`nl-${raw}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b7bff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#6ee7ff" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id={`nh-${raw}`}>
          <stop offset="0%" stopColor="#8b7bff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#8b7bff" stopOpacity="0" />
        </radialGradient>
        <filter id={`ng-${raw}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {nodes.map((node) => (
        <line
          key={`line-${node.key}`}
          x1={cx}
          y1={cy}
          x2={node.x}
          y2={node.y}
          stroke={`url(#nl-${raw})`}
          strokeWidth="2"
        />
      ))}

      <circle cx={cx} cy={cy} r="88" fill={`url(#nh-${raw})`} className="node-glow" />
      <circle cx={cx} cy={cy} r="52" fill="none" stroke="#6ee7ff" strokeWidth="1" opacity="0.4" />
      <circle cx={cx} cy={cy} r="42" fill="#1b1a55" stroke="#8b7bff" strokeWidth="2.5" />
      <g transform={`translate(${cx - 26} ${cy - 28}) scale(0.33)`}>
        <path d={HEART_PATH} fill="#8b7bff" opacity="0.92" />
        <path d={CROSS_PATH} fill="#eaf0ff" />
      </g>
      <text
        x={cx}
        y={cy + 36}
        textAnchor="middle"
        fill="#eaf0ff"
        fontSize="13"
        fontWeight="700"
        opacity="0.85"
      >
        {doctors.length} / {patients.length}
      </text>

      {nodes.map((node) => {
        const tone = TONE[node.tone];
        const dots = Math.min(node.patients, 4);
        return (
          <g key={node.key}>
            <circle
              cx={node.x}
              cy={node.y}
              r="26"
              fill="#201f63"
              stroke={tone.ring}
              strokeWidth="2.5"
              filter={`url(#ng-${raw})`}
            />
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              fill="#eaf0ff"
              fontSize="14"
              fontWeight="800"
            >
              {node.initials}
            </text>
            {Array.from({ length: dots }, (_, i) => {
              const a = -Math.PI / 2 + (i - (dots - 1) / 2) * 0.85;
              return (
                <circle
                  key={`${node.key}-p${i}`}
                  cx={node.x + 44 * Math.cos(a)}
                  cy={node.y + 44 * Math.sin(a)}
                  r="6"
                  fill={tone.dot}
                  opacity="0.85"
                />
              );
            })}
            {node.patients > 4 && (
              <text x={node.x + 30} y={node.y + 34} fill="#a9b4e6" fontSize="12" fontWeight="700">
                +{node.patients - 4}
              </text>
            )}
          </g>
        );
      })}

      {doctors.length > shown.length && (
        <text x="626" y="286" textAnchor="end" fill="#a9b4e6" fontSize="13" fontWeight="700">
          +{doctors.length - shown.length}
        </text>
      )}
    </svg>
  );
}

/** Pastdagi to'lqin: bemor paneli yakuni. */
export function CareWave({ className }: { className?: string }) {
  const raw = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 1200 180"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`wt-${raw}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fc3f5" />
          <stop offset="100%" stopColor="#3f78c8" />
        </linearGradient>
        <linearGradient id={`wd-${raw}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c4f97" />
          <stop offset="100%" stopColor="#0b2a58" />
        </linearGradient>
      </defs>
      <path
        d="M0 96C160 40 300 150 470 108 640 66 760 152 920 112 1050 80 1130 118 1200 96V180H0Z"
        fill={`url(#wt-${raw})`}
        opacity="0.85"
      />
      <path
        d="M0 132C180 96 320 172 500 140 680 108 820 176 1000 146 1100 130 1160 148 1200 138V180H0Z"
        fill={`url(#wd-${raw})`}
      />
      <path
        d="M0 96C160 40 300 150 470 108 640 66 760 152 920 112 1050 80 1130 118 1200 96"
        fill="none"
        stroke="#e0b45f"
        strokeWidth="3"
      />
    </svg>
  );
}
