import React from 'react';
import {renderToString} from 'react-dom/server';
import App from './App.jsx';

// Build-time only: renders the page to static HTML so search engines and AI crawlers that do not run
// JavaScript get the full text (scripts/prerender.mjs puts it into the release index.html)
export const render = (office, path = '/') => renderToString(<App office={office} path={path}/>);
