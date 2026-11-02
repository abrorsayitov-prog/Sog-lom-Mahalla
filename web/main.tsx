import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";

import { routeTree } from "../src/routeTree.gen";
import { createQueryClient } from "../src/lib/query-client";
import { renderMode } from "../src/lib/render-mode";
import "../src/styles.css";

renderMode.spa = true;

// Every deep link is served by this one index.html, so panel pages must not be
// indexed or they would compete with the landing page as duplicate content.
const landingTitle = "Sog‘lom Mahalla — dori va davolanish nazorati";
const panelTitles: Record<string, string> = {
  "/admin": "Admin paneli — Sog‘lom Mahalla",
  "/doctor": "Shifokor paneli — Sog‘lom Mahalla",
  "/patient": "Bemor paneli — Sog‘lom Mahalla",
};
function applyDocumentMeta(pathname: string) {
  const panel = Object.entries(panelTitles).find(([prefix]) => pathname.startsWith(prefix));
  document.title = panel ? panel[1] : landingTitle;
  let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (!robots) {
    robots = document.createElement("meta");
    robots.name = "robots";
    document.head.append(robots);
  }
  robots.content = panel ? "noindex,nofollow" : "index,follow";
}
applyDocumentMeta(location.pathname);

const queryClient = createQueryClient();

const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
});

router.subscribe("onResolved", () => applyDocumentMeta(router.state.location.pathname));

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
