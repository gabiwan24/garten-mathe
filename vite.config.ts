import { svelte } from '@sveltejs/vite-plugin-svelte';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

// HTTPS + host: the phone on the LAN needs a secure context for motion sensors.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [svelte(), basicSsl()],
  server: { host: true },
});
