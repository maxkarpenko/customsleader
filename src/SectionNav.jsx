import React, {useEffect, useState} from 'react';
import './sectionNav.css';

// Section navigation that shows where the visitor is on the page.
// Dots on the left edge: the current one stretches and shows its name; each dot scrolls to its section.
const SECTIONS = [
  ['section.hero', 'Начало'],
  ['section.tasks', 'Задачи'],
  ['section.services', 'Услуги'],
  ['section.cases', 'Кейсы'],
  ['section.request', 'Расчёт'],
  ['section.journey', 'Этапы'],
  ['section.team', 'Команда'],
  ['section.insurance', 'Страхование'],
  ['section.founder', 'Основатель'],
  ['section.faq', 'Вопросы'],
  ['section.final-request', 'Заявка'],
  ['section.clients-section', 'Клиенты'],
  ['section.contact', 'Контакты'],
];
const LAST = SECTIONS.length - 1;
const PROBE = .38; // the reading line, as a share of the viewport height

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
// 1 on the item the reading line is at, fading to 0 one item away
const near = (pos, j) => { const t = clamp(1 - Math.abs(pos - j)); return t * t * (3 - 2 * t); };

// Light or dark surface under a point, read from the nearest opaque background
function toneOf(el){
  for(let n = el; n; n = n.parentElement){
    const m = getComputedStyle(n).backgroundColor.match(/[\d.]+/g);
    if(m && (m[3] === undefined || Number(m[3]) > .5)){ const [r, g, b] = m.map(Number); return (.2126 * r + .7152 * g + .0722 * b) / 255 > .55 ? 'light' : 'dark'; }
  }
  return 'dark';
}

function useSectionScroll(){
  const [s, setS] = useState({pos: 0, active: 0, toneMid: 'dark'});
  useEffect(() => {
    let frame = null;
    const measure = () => {
      frame = null;
      const els = SECTIONS.map(([sel]) => document.querySelector(sel));
      if(els.some(e => !e)) return;
      const y = scrollY, vh = innerHeight, docH = document.documentElement.scrollHeight;
      const tops = els.map(e => e.getBoundingClientRect().top + y);
      const ends = tops.map((t, k) => k < LAST ? tops[k + 1] : docH);
      const probe = y + vh * PROBE;
      let i = 0; tops.forEach((t, k) => { if(t <= probe) i = k; });
      let pos = i + clamp((probe - tops[i]) / (ends[i] - tops[i]));
      if(y + vh >= docH - 2){ i = LAST; pos = LAST; }
      setS({pos, active: i, toneMid: toneOf(els[i])});
    };
    const queue = () => { if(!frame) frame = requestAnimationFrame(measure); };
    addEventListener('scroll', queue, {passive: true}); addEventListener('resize', queue);
    const ro = new ResizeObserver(queue); ro.observe(document.body);
    const mo = new MutationObserver(queue); mo.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme', 'data-tone']});
    queue();
    return () => { removeEventListener('scroll', queue); removeEventListener('resize', queue); ro.disconnect(); mo.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  return s;
}

function scrollToSection(j, offset = 24){
  const el = document.querySelector(SECTIONS[j][0]); if(!el) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = j === 0 ? 0 : el.getBoundingClientRect().top + scrollY - offset;
  scrollTo({top, behavior: reduce ? 'auto' : 'smooth'});
}

export default function SectionNav(){
  const s = useSectionScroll();
  return <nav className="section-dots" data-tone={s.toneMid} aria-label="Разделы страницы">
    {SECTIONS.map(([, label], j) => <button type="button" key={j} className="section-dot" style={{'--m': near(s.pos, j)}} onClick={() => scrollToSection(j)} aria-current={j === s.active ? 'true' : undefined}><i/><span>{label}</span></button>)}
  </nav>;
}
