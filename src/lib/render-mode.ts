/**
 * The static build (web/main.tsx) already renders <html>/<head>/<body> through
 * web/index.html and mounts React inside #root. Rendering the Start document shell
 * there too produces a nested document tree, which makes React DOM loop forever on
 * the first dispatched event. The Lovable/TanStack Start entry never sets this flag.
 */
export const renderMode = { spa: false };
