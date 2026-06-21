import { h, render } from 'preact';
import './styles.css';
import { App } from './App.jsx';

render(
  <App maxFret={12} defaultTab="fretboard" showInlays={true} />,
  document.getElementById('app')
);

// Offline-capable + instant repeat loads. Disabled in dev so HMR isn't cached.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
