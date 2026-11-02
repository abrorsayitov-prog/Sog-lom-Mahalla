import { useEffect } from "react";
import type { PatientHome } from "./api";
import { planState } from "./api";
import {
  hasRung,
  markRung,
  playAlarmSound,
  showLocalNotification,
  unlockAlarmAudio,
  vibratePhone,
} from "./alarm";
import { useI18n } from "./i18n";

const LOOKBACK_MINUTES = 12;

function minutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((v) => Number.parseInt(v, 10));
  return (h || 0) * 60 + (m || 0);
}

/** Budilnik: oxirgi ~12 daqiqada kelgan va belgilanmagan vazifalar jiringlaydi. */
export function usePatientAlarm(home: PatientHome | undefined) {
  const { t } = useI18n();

  useEffect(() => {
    const unlock = () => unlockAlarmAudio();
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "alarm") {
        playAlarmSound();
        vibratePhone();
      }
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => navigator.serviceWorker?.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!home) return;
    const state = planState(home.patient, home.tasks, home.logs, home.serverNow);
    const nowMinute = minutesOfDay(state.time);
    const fresh = state.missed.filter(
      (task) =>
        task.remind &&
        nowMinute - minutesOfDay(task.time) <= LOOKBACK_MINUTES &&
        !hasRung(state.date, task.id),
    );
    const first = fresh[0];
    if (!first) return;
    const titles = fresh.map((task) => `${task.time} — ${task.title}`).join(", ");
    playAlarmSound();
    vibratePhone();
    showLocalNotification(t("notif.due.title"), titles, `${state.date}-${first.id}`);
    markRung(
      state.date,
      fresh.map((task) => task.id),
    );
  }, [home, t]);
}
