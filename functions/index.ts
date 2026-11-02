import { createDatabaseClient, createSiteContext, errorResponse } from './_qoder/backend.mjs';
import { application } from './routes.mjs';

// Ilova o'z hisoblarini o'zi boshqaradi (admin login+parol, shifokor/bemor
// telefon+parol), shuning uchun platforma cookie'lari funksiya sahifasiga
// yetkazilmaydi emas, balki ilovaning o'z Cookie boshi saqlanadi.
const handle = application({
  db: createDatabaseClient(),
  env: (name: string) => Deno.env.get(name),
  origin: () => Deno.env.get('APP_ORIGIN'),
});

Deno.serve(async (request) => {
  let context;
  try {
    context = createSiteContext(request, { forwardApplicationCredentials: true });
    return await handle(context);
  } catch (error) {
    return errorResponse(error, context?.requestId);
  }
});
