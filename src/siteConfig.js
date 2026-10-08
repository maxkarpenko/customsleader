// Site-wide default for illustrations: '3d' renders the WebGL scenes, 'images' shows still photos instead.
// The 3D code stays in the project either way. /3d.html stores a per-browser override for previewing.
export const SCENES_MODE='images';
export const SCENES_KEY='scenes-mode';
// Dev-only image tweak panels, switched on /3d.html ('0' hides a group; anything else shows it).
export const TWEAKS_CASES_KEY='tweaks-cases';
export const TWEAKS_STILLS_KEY='tweaks-stills';
export const TWEAKS_FOUNDER_KEY='tweaks-founder';
// Colour themes: Graphite (dark) is the default, Steel the light one. THEME_SWITCHER shows the sun/moon
// button in the header; set it to false to hide it and always use Graphite.
export const THEME_KEY='site-theme';
export const THEME_SWITCHER=true;
// Cookie notice. Bump COOKIE_CONSENT_VERSION when the cookie policy changes so visitors are asked again.
// Analytics loads only after "Принять все": set YANDEX_METRIKA_ID to the counter number (e.g. 12345678)
// and GOOGLE_ANALYTICS_ID to the GA4 measurement ID (e.g. 'G-XXXXXXXXXX'). null keeps a service off.
export const COOKIE_CONSENT_KEY='cookie-consent';
export const COOKIE_CONSENT_VERSION='2026-10-05';
export const YANDEX_METRIKA_ID=null;
export const GOOGLE_ANALYTICS_ID=null;
