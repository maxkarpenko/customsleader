import React, {useLayoutEffect} from 'react';
import { createRoot } from 'react-dom/client';
import App, {preparePage} from './App.jsx';
import './styles.css';

const root = document.getElementById('root');

// The release build ships a prerendered copy of the page for search engines; it stays hidden for visitors
// (html.prerender-wait) and React replaces it with the live page on the first render, so nothing changes on screen.
// Shown in a layout effect of a component placed before <App/>: React runs it before App's own layout effects,
// so the page is visible when App measures the header
function Reveal(){
  useLayoutEffect(() => {
    root.removeAttribute('data-prerendered');
    document.documentElement.classList.remove('prerender-wait');
  }, []);
  return null;
}

// the open page's text is a separate file: it loads first, then the page renders once with its full content
preparePage().catch(() => {}).finally(() => createRoot(root).render(<><Reveal /><App /></>));
