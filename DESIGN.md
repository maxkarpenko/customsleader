---
name: Customs Leader
description: Graphite industrial studio with the brand-green route
colors:
  ink: "#171b1d"
  paper: "#edeee8"
  text: "#f0f1eb"
  muted: "#acb8b7"
  green: "#2faf6b"
  green-hover: "#4cc283"
  green-deep: "#00542a"
  green-deep-hover: "#006a36"
  green-tint: "#d9e9de"
  line: "#3b4244"
  light-muted: "#525d58"
  light-line: "#cbd0cb"
  field-border: "#b4c0c0"
  field-focus: "#00542a"
  field-focus-bg: "#f0f1eb"
  steel-900: "#202628"
  steel-850: "#283332"
  steel-600: "#5b6a65"
  steel-550: "#687172"
  steel-500: "#80918c"
  steel-400: "#93a49f"
  steel-350: "#9dadae"
  steel-300: "#acb8b7"
  steel-250: "#b4c0c0"
  steel-200: "#bdc7c6"
  steel-150: "#cbd0cb"
  tint-300: "#d7ded5"
  tint-200: "#e8ede4"
  error: "#852806"
  error-bg: "#f3d8cf"
  stop: "#ff5a4f"
  stop-text: "#ff6b5e"
  stop-tint: "#3a1f1d"
typography:
  display:
    fontFamily: "Golos, Arial, sans-serif"
    fontSize: "clamp(37px, 4.2vw, 62px)"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-.038em"
  headline:
    fontFamily: "Golos, Arial, sans-serif"
    fontSize: "clamp(32px, 3.7vw, 55px)"
    fontWeight: 500
    lineHeight: 1.13
    letterSpacing: "-.035em"
  title:
    fontFamily: "Golos, Arial, sans-serif"
    fontSize: "31px"
    fontWeight: 500
    lineHeight: 1.18
    letterSpacing: "-.02em"
  body:
    fontFamily: "Golos, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
  field-label:
    fontFamily: "Golos, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  button:
    fontFamily: "Golos, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.35
rounded:
  control: "3px"
  outline: "4px"
  surface: "5px"
  dialog: "6px"
spacing:
  section: "clamp(72px, 9vw, 138px)"
  section-mobile: "70px"
  field: "16px"
  form-padding: "28px"
  column-gap: "48px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "17px 20px"
  button-primary-hover:
    backgroundColor: "{colors.green-hover}"
  button-secondary:
    backgroundColor: "transparent"
    rounded: "{rounded.control}"
    padding: "17px 20px"
  field:
    backgroundColor: "transparent"
    rounded: "{rounded.control}"
    padding: "12px 13px"
  form-surface:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "28px"
---

# Design System: Customs Leader

## Overview

**Creative North Star: "Graphite photography studio"**

A graphite studio gives industrial geometry room to read: silver metal, pale warm type and the brand-green route taken from the company logo. Firm rectangular controls and restrained rounding keep the inquiry interface practical alongside the cinematic illustration.

This is a code-led React and Three.js system. Procedural models are explicitly illustrations; original Russian content and facts retain authority over the visual story. Local Golos fonts and vector geographic data supply the shipped assets; there are no shipping rasters.

**Key Characteristics:**
- Graphite and pale-paper sections with brand-green actions.
- Self-hosted Cyrillic typography and generous editorial spacing.
- Procedural transport illustrations, with an empty-platform opening and closing.
- Native controls and readable content independent of WebGL.

## Colors

### Primary
Brand green comes from the logo (`#00542A`). On graphite it is lifted to `green` (the same hue as the light-on-dark logo) for actions, the selected transport stage, figures and the illustrated route, with `green-hover` brightening the action. On paper surfaces (light sections, forms, dialogs, the cookie notice and toasts) the `--accent` token switches to `green-deep`, the logo colour itself, with light text on actions; `green-tint` marks selected service cards. Neutral greys come from one steel ramp (`--steel-900` … `--steel-150`, `--tint-300`, `--tint-200`) and `--ink-muted` for secondary text on paper; error colours stay red. A separate stop red (`stop`, `stop-text`, `stop-tint`) is reserved for the "Не работаем" exclusions panel on graphite: red frame, red heading and ✕ marks, light item text; it is not an action or brand colour.

### Neutral
Graphite (`ink`) is the studio and dark-section ground; warm paper (`paper`) is the contrasting form and light-section surface. Pale text (`text`), muted text (`muted`) and structural rules (`line`) establish the dark hierarchy. Light sections replace muted text and rules with `light-muted` and `light-line`. Field border and focus colors belong to form interaction, not a second brand accent.

**The Route Rule.** Green marks action and transport continuity rather than filling every surface.

## Typography

Golos is self-hosted through two local TrueType files, with Arial and sans-serif fallbacks. The regular face is declared for weights 400–500 and bold for 600–800; font synthesis is disabled. There is no separate display or monospace face.

The display and headline roles use the fluid values above; service titles provide the representative title role. Supporting text uses role tokens instead of ad-hoc pixel values: `--fs-lead` (19px, 17px on mobile) for the paragraph that introduces a card, case or section; `--fs-sub` (21px, 19px on mobile) for card sub-heads such as task, team, benefit and case-step headings; `--fs-body` (16px) for bullets, detail paragraphs and dialog text; `--fs-small` (15px) for buttons, tabs, service choices and notes; `--fs-meta` (14px) for header and footer secondary text, form labels and form intros; `--fs-micro` (13px) for legal fine print, consent text, captions and route stops; `--fs-input` (16px) for every field, which also prevents iOS zoom. Phone numbers in the header and footer are 18px (15px in the mobile header, where the email is hidden; it remains in the contact section and footer). Adjacent roles must differ in size and tone: lead text uses `steel-200`, body `steel-300` (or `ink-muted` on paper), and actions inside cards are 600 weight in the accent colour above a hairline. Case steps set their label (Задача:, Сложность:, Решение:) inline in the accent colour at 600 weight, never as a separate line above the heading. 13px is the floor for any text. Headings above the card level use three tokens: `--fs-h2` (clamp(32px, 3.7vw, 55px), 34px on mobile) for section titles, `--fs-h2-compact` (clamp(30px, 3.1vw, 46px), 30px on mobile) for team, FAQ and contact titles, and `--fs-h3` (clamp(24px, 2.2vw, 31px), 26px on mobile) for service, case, journey, founder, form and dialog titles. Section headings carry more space above than below: sections pad 1.25× `--space` on top, and the gap below a section heading is clamp(40px, 4.5vw, 64px). Form labels are compact; inputs grow to 16px on mobile. Headings use balanced wrapping and tight tracking. Large green case figures are a separate contextual treatment (67px desktop, 54px mobile), not a universal heading scale.

## Layout

The centered container is capped at 1328px, with 48px side gutters. At 1200px and below gutters become 32px; at 650px and below they become 20px. Section spacing is fluid, then 70px on mobile. Dividers and aligned text columns create structure without putting every paragraph in a card.

Breakpoints are 1600px minimum, and 1200px, 900px and 650px maximum. At 900px task and team grids reduce from four columns to two; the header wraps. At 650px the hero, case, journey, founder, contact and final-request layouts stack; service cards and detailed form columns become single-column, while task cards and stage tabs retain two columns. Existing mobile overrides preserve the Russia link, callback and project copy. A mobile hero action brings the detailed inquiry into reach.

Above 650px the opening composition uses a 1750px scroll area with the story and compact form sticky at 26px; the header itself is not sticky. The stage is 360px tall after the final desktop override. Mobile removes this pinning and uses a 240px stage. Reduced motion also removes sticky positioning and the extended hero height. See the surface contract for this page-specific sequence rather than applying it to every future screen.

## Elevation & Depth

Ordinary content is flat, separated by tonal changes and fine rules. Physical depth belongs to the Three.js studio: lit procedural metal, soft shadows, fog, winter geometry and a geographic globe. Overlay depth uses only a modal shadow (`0 20px 80px #0007`) and toast shadow (`0 8px 35px #0004`). The modal backdrop is translucent near-black (`#090e10cc`).

## Shapes

Controls are firm rectangles with small corners. Inputs and primary buttons use the control radius; outlined controls use the outline radius; compact forms and illustrations use the surface radius. Dialogs use the dialog radius. Circular exceptions communicate a point or utility: route stops, the motion control and social controls. On mobile, full-width case and journey illustrations lose rounding.

## Components

### Actions and navigation

The primary button is green: bright green with graphite text on dark surfaces, deep brand green with pale text on paper,, an inline arrow, and a minimum height of 52px. Hover brightens it; active translates it down 1px. Secondary actions use an outline and inherited text color. Header links and callbacks turn green on hover. All keyboard focusable controls receive a 2px accent outline (bright green on dark, deep green on paper) with a 5px offset. The skip link becomes visible on focus.

### Forms and feedback

Compact forms use the pale surface and form padding; the detailed form instead sits in the section with a top divider. Fields use explicit labels, native input types, autocomplete, required constraints and a telephone pattern. Service selection uses native checkboxes and a tinted selected rectangle. Consent remains a native checkbox. Native validation precedes submission; missing detailed-form service selection produces an alert.

Without `VITE_LEAD_ENDPOINT`, submission displays a live status explaining that this local form is not connected and supplies the phone number. No request is sent. With an endpoint, success requires an HTTP success and JSON `ok: true`; sending disables the submit button, and failure produces a live error. Do not turn the implemented success component into evidence of a connected CRM.

### Dialogs, tabs and disclosure

Callback, Russia and legal overlays use native `dialog.showModal()` with a labelled heading, explicit close button, Escape handling, outside-click dismissal and temporary body scroll locking. Legal overlays honestly identify missing launch documents. The platform supplies modal focus behavior.

Journey controls use native buttons enhanced with tablist/tab/tabpanel roles, selected state and roving tab index. Left/right arrows wrap selection; Home/End choose the first/last tab. Each active panel is labelled by its tab and focusable. FAQ and estimate explanations use native details/summary; the FAQ plus rotates when expanded.

### Motion and scene behavior

The shared easing is `cubic-bezier(.16,1,.3,1)`. Buttons and fields transition over .2s; service arrows and FAQ indicators over .3s; tab copy enters over .4s; task illustrations lift over .6s; headings reveal over .7s. Heading reveals run once on intersection. State changes travel rather than jump: the journey tab indicator slides between stages (.5s), the route line under the stages fills in green up to the active stop (.7s, measured to the dot), FAQ answers open by height with a short fade (.4s, progressive enhancement via `interpolate-size`), dialogs rise in (.38s) over a fading backdrop, and button arrows nudge toward their direction on hover (.25s). The 2D route fill is the page-level echo of the 3D route; no other decorative motion is added. Content is not initially hidden behind an animation requirement.

Scenes are lazily imported near the viewport, render only while visible and the document is visible, and limit device pixel ratio to 1.6. Scroll drives target progress with .09 interpolation; it is not wheel interception. A labelled image wrapper surrounds an aria-hidden canvas, and a textual fallback keeps the page usable without WebGL.

The operating-system reduced-motion preference initializes state and is observed for changes. Under reduced motion all animations and movement stop, but color, background, border and opacity changes still transition over .15s so state feedback stays legible. The fixed play/pause button can toggle scene motion; both the state class and media query remove CSS animations and transitions. Reduced scenes stop their animation loop, retain a representative render, freeze wheels/snow/globe motion and show the hero empty. Anchor scrolling checks the OS preference; the manual pause toggle does not itself alter that anchor helper. Cookie acknowledgement uses local storage; motion preference is not persisted.

## Do's and Don'ts

### Do:
- Do retain the original Russian facts and content order.
- Do use green for actions, route geometry and meaningful selected states; never the logo's deep green as text or icons on graphite.
- Do keep forms and text usable when WebGL or animation is unavailable.
- Do preserve native field labels, keyboard focus and honest demo submission feedback.

### Don't:
- Don't introduce documentary claims through illustrative geometry.
- Don't replace the missing founder photo with an invented employee portrait.
- Don't claim CRM success when no endpoint is connected.
- Don't add decorative shadows to ordinary content sections.
