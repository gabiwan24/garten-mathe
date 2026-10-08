// Builds the GitHub Pages site: the Zaubergarten (lab/blumenweg.html) is the app, served at the site root.
import { cpSync, copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
rmSync('site', { recursive: true, force: true });
mkdirSync('site', { recursive: true });
cpSync('lab', 'site', { recursive: true, filter: p => !/(^|[\/])(tests|node_modules)([\/]|$)|GATES\.md$|package\.json$/.test(p) });
rmSync('site/tests', { recursive: true, force: true });
copyFileSync('lab/blumenweg.html', 'site/index.html');
// The old Svelte app registered a service worker at this path; replace it with one that removes itself and its caches,
// so phones that installed the old version load the new app.
writeFileSync('site/sw.js', `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll()) c.navigate(c.url);
})()));
`);
console.log('site built');
