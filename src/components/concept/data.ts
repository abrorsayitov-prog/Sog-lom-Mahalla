/* namunaviy ma'lumotlar — har panelning o'z ro'yxati, panellar orasida bo'linmaydi */

export type DoctorRow = {
  name: string;
  specialty: string;
  patients: number;
  state: string;
  tone: "success" | "warning" | "danger";
  initials: string;
};

export type PatientRow = {
  name: string;
  phone: string;
  disease: string;
  state: "Og‘ir" | "O‘rta" | "Yengil";
  tone: "danger" | "warning" | "success";
  initials: string;
  doctor: string;
};

/* Admin paneli — platformadagi shifokorlar */
export const adminDoctors: DoctorRow[] = [
  {
    name: "Karimova Dilshoda",
    specialty: "Terapevt",
    patients: 48,
    state: "Faol",
    tone: "success",
    initials: "KD",
  },
  {
    name: "Raxmatov Sardor",
    specialty: "Kardiolog",
    patients: 42,
    state: "Faol",
    tone: "success",
    initials: "RS",
  },
  {
    name: "To‘xtayeva Mohira",
    specialty: "Endokrinolog",
    patients: 36,
    state: "Faol",
    tone: "success",
    initials: "TM",
  },
  {
    name: "Qodirov Bekzod",
    specialty: "Pediatr",
    patients: 28,
    state: "Faol",
    tone: "success",
    initials: "QB",
  },
  {
    name: "Ergasheva Nilufar",
    specialty: "Nevrolog",
    patients: 24,
    state: "Kutilmoqda",
    tone: "warning",
    initials: "EN",
  },
];

/* Shifokor paneli — Dr. Dilshodaning o'z bemorlari */
export const doctorPatients: PatientRow[] = [
  {
    name: "Raxmatova Zebo",
    phone: "+998 90 123 45 67",
    disease: "Gipertoniya",
    state: "Og‘ir",
    tone: "danger",
    initials: "RZ",
    doctor: "Karimova Dilshoda",
  },
  {
    name: "Tojiboev Sanjar",
    phone: "+998 91 234 56 78",
    disease: "Qandli diabet",
    state: "O‘rta",
    tone: "warning",
    initials: "TS",
    doctor: "Karimova Dilshoda",
  },
  {
    name: "Yusupova Malika",
    phone: "+998 93 345 67 89",
    disease: "Bronxit",
    state: "Yengil",
    tone: "success",
    initials: "YM",
    doctor: "Karimova Dilshoda",
  },
  {
    name: "Karimov Botir",
    phone: "+998 94 456 78 90",
    disease: "Gastrit",
    state: "O‘rta",
    tone: "warning",
    initials: "KB",
    doctor: "Karimova Dilshoda",
  },
  {
    name: "Nurmatova Dilnoza",
    phone: "+998 97 567 89 01",
    disease: "Osteoxondroz",
    state: "Yengil",
    tone: "success",
    initials: "ND",
    doctor: "Karimova Dilshoda",
  },
  {
    name: "Sobirov Anvar",
    phone: "+998 98 678 90 12",
    disease: "Insult oqibati",
    state: "Og‘ir",
    tone: "danger",
    initials: "SA",
    doctor: "Karimova Dilshoda",
  },
];

/* Admin paneli — hamma bemorlar, kuzatuv ustuni bilan */
export const adminPatients: PatientRow[] = [
  ...doctorPatients,
  {
    name: "Abdullayeva Gulnora",
    phone: "+998 99 789 01 23",
    disease: "Anemiya",
    state: "O‘rta",
    tone: "warning",
    initials: "AG",
    doctor: "Raxmatov Sardor",
  },
  {
    name: "Xolmatov Javlon",
    phone: "+998 90 890 12 34",
    disease: "Pnevoniya",
    state: "Og‘ir",
    tone: "danger",
    initials: "XJ",
    doctor: "To‘xtayeva Mohira",
  },
];

export const adminRequests = [
  { name: "Yo‘ldosheva Gulnora", specialty: "Terapevt", when: "Bugun, 09:12", initials: "YG" },
  { name: "Mirzayev Otabek", specialty: "Nevrolog", when: "Kecha, 17:40", initials: "MO" },
];

export const adminEvents = [
  { text: "Yangi shifokor so‘rovi keldi", who: "Yo‘ldosheva Gulnora", time: "10:24" },
  { text: "Bemor qo‘shildi", who: "Xolmatov Javlon", time: "09:45" },
  { text: "Davolanish yakunlandi", who: "Yusupova Malika", time: "08:32" },
  { text: "Yangi ariza", who: "Sobirov Anvar", time: "06:15" },
];

export const adminMessages = [
  { name: "Karimova Dilshoda", note: "Bemor ro‘yxatini yangiladim", initials: "KD" },
  { name: "Raxmatov Sardor", note: "Kardiolog bo‘limi hisoboti", initials: "RS" },
  { name: "Qodirov Bekzod", note: "Pediatr uchun kirish so‘rovi", initials: "QB" },
];

export const doctorAppointments = [
  { time: "08:00", name: "Raxmatova Zebo", note: "Bosimni o‘lchash", done: true },
  { time: "10:00", name: "Tojiboev Sanjar", note: "Qandni tekshirish", done: true },
  { time: "13:00", name: "Karimov Botir", note: "Gastroskopiya yo‘llanma", done: false },
  { time: "16:00", name: "Sobirov Anvar", note: "Reabilitatsiya", done: false },
];

export const doctorTasks = [
  { time: "08:00", title: "Bemor qabuli", note: "Raxmatova Zebo — bosim nazorati", pill: false },
  {
    time: "09:30",
    title: "Dori belgilash",
    note: "Tojiboev Sanjar — Metformin 1000mg",
    pill: true,
  },
  { time: "12:00", title: "Tahlil natijalari", note: "Yusupova Malika — umumiy qon", pill: false },
  { time: "15:00", title: "Navoiy poliklinikasi", note: "Konsultatsiya", pill: false },
  { time: "17:30", title: "Kunlik hisobot", note: "Bemorlar holatini yozish", pill: false },
];

export const doctorMessages = [
  { name: "Raxmatova Zebo", note: "Dorim tugadi, yo‘llanma kerak", initials: "RZ" },
  { name: "Tojiboev Sanjar", note: "Ertangi qabulga yetib boraman", initials: "TS" },
  { name: "Nurmatova Dilnoza", note: "Tahlil natijasi tayyormi?", initials: "ND" },
];

export const patientTasks = [
  { time: "08:00", title: "Nonushta", note: "Sut, tuxum, sabzavot", food: true },
  { time: "09:00", title: "Dori qabul qilish", note: "Amoksitsillin 500mg", food: false },
  { time: "13:00", title: "Tushlik", note: "To‘yimli taom, ko‘katlar", food: true },
  { time: "17:00", title: "Dori qabul qilish", note: "Vitamin D3", food: false },
  { time: "20:00", title: "Kechki ovqat", note: "Yengil taom", food: true },
];

export const severityRows = [
  { label: "Og‘ir", value: 8, tone: "danger" as const, icon: "♥" },
  { label: "O‘rta", value: 15, tone: "warning" as const, icon: "◉" },
  { label: "Yengil", value: 13, tone: "success" as const, icon: "♡" },
];

/* Grafik namunaviy raqamlari — har panelning o‘z ko‘lami */
export const adminChartStats = { total: 2480, ogir: 320, orta: 980, yengil: 1180 };
export const adminChartAxis = 400;
export const doctorChartStats = { total: 36, ogir: 8, orta: 15, yengil: 13 };
export const doctorChartAxis = 8;
