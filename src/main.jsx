import { h, render } from 'preact';
import './styles.css';
import { Fretwise } from './Fretwise.jsx';

render(
  <Fretwise maxFret={12} defaultTab="fretboard" showInlays={true} />,
  document.getElementById('app')
);

// Offline-capable + instant repeat loads. Disabled in dev so HMR isn't cached.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
