const RUNG_KEY = "sogLomMahalla.rung.v1";

type RungMap = Record<string, string[]>;

function readRung(): RungMap {
  try {
    return JSON.parse(window.localStorage.getItem(RUNG_KEY) ?? "{}") as RungMap;
  } catch {
    return {};
  }
}

/** Bir vazifa bugun allaqachon jiringlatilgani — takrorlanishning oldini oladi. */
export function hasRung(date: string, taskId: string): boolean {
  return (readRung()[date] ?? []).includes(taskId);
}

export function markRung(date: string, taskIds: string[]): void {
  const map = readRung();
  map[date] = [...new Set([...(map[date] ?? []), ...taskIds])];
  for (const key of Object.keys(map)) {
    if (key !== date) delete map[key];
  }
  try {
    window.localStorage.setItem(RUNG_KEY, JSON.stringify(map));
  } catch {
    /* storage may be blocked */
  }
}

let context: AudioContext | null = null;

/** Brauzer tovushni faqat birinchi bosishdan keyin eshitadi. */
export function unlockAlarmAudio(): void {
  if (typeof window === "undefined") return;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  if (!context) context = new Ctor();
  if (context.state === "suspended") void context.resume();
}

/** Budilnik: uch marta "biiip-biiip" — API'ga havola yo'q, WebAudio'da yasatiladi. */
export function playAlarmSound(rings = 3): void {
  unlockAlarmAudio();
  if (!context) return;
  const start = context.currentTime + 0.05;
  for (let ring = 0; ring < rings; ring += 1) {
    for (const [offset, tone] of [
      [0, 880],
      [0.18, 1175],
    ] as const) {
      const at = start + ring * 0.62 + offset;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = tone;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.18);
    }
  }
}

export function vibratePhone(): void {
  navigator.vibrate?.([700, 250, 700, 250, 1000, 400, 1000]);
}

export function showLocalNotification(title: string, body: string, tag: string): void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      tag,
      icon: "/icons/icon.png",
      requireInteraction: true,
    });
  } catch {
    /* ba'zi brauzerlarda konstruktor yo'q */
  }
}
