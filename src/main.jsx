import React, {useLayoutEffect} from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

const root = document.getElementById('root');

// The release build ships a prerendered copy of the page for search engines; it stays hidden for visitors
// (html.prerender-wait) and React replaces it with the live page on the first render, so nothing changes on screen
function Boot({children}){
  useLayoutEffect(() => {
    root.removeAttribute('data-prerendered');
    document.documentElement.classList.remove('prerender-wait');
  }, []);
  return children;
}

createRoot(root).render(<Boot><App /></Boot>);
