import { mount } from 'svelte';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './app.css';
import App from './App.svelte';

const app = mount(App, { target: document.getElementById('app')! });

export default app;
