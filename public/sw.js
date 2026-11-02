/* Sog'lom Mahalla — service worker.
   Push xabari bo'sh keladi (VAPID imzolangan, payload yo'q), shuning uchun
   budilnik ro'yxati shu yerdan API'dan o'qiladi: telefon ekrani yopiq bo'lsa ham
   bildirishnoma chalinadi. */

const API = "/functions/v1/app/api/patient/due";
const PANEL = "/patient";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

async function dueTasks() {
  const response = await fetch(API, { credentials: "include", headers: { accept: "application/json" } });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("due_" + response.status);
  return response.json();
}

async function ring(registration) {
  let payload;
  try {
    payload = await dueTasks();
  } catch {
    payload = { time: "", due: [{ title: "", time: "" }] };
  }
  if (payload === null) return;
  const tasks = payload.due || [];
  if (tasks.length === 0) return;

  const titles = tasks.map((task) => `${task.time} — ${task.title}`).join(", ");
  const tag = `soglom-${payload.date || ""}-${tasks[0].id || tasks[0].time}`;
  await registration.showNotification("Sog'lom Mahalla — vazifa vaqti", {
    tag,
    body: titles,
    icon: "/icons/icon.png",
    badge: "/icons/icon.png",
    lang: "uz",
    vibrate: [600, 250, 600, 250, 900, 400, 900],
    requireInteraction: true,
    data: { url: PANEL, titles },
  });

  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) client.postMessage({ type: "alarm", titles, tag });
}

self.addEventListener("push", (event) => {
  event.waitUntil(ring(self.registration));
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "tick") event.waitUntil(ring(self.registration));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || PANEL;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (list) => {
      for (const client of list) {
        if ("focus" in client) {
          await client.focus();
          if (client.url !== target) await client.navigate(target);
          return client;
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
