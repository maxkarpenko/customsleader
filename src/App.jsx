import React, {useEffect, useId, useLayoutEffect, useRef, useState, createContext, useContext} from 'react';
import {ChevronDown, ArrowLeft, ArrowUpRight, ArrowRight, ArrowDown, ArrowUp, Sun, Moon, Check, Plus, Minus, X, ShieldCheck, PackageCheck, Route, Truck, FileCheck2, Globe2, MessageCircle, MessageSquare, UserRound, CircleCheck, Info, LoaderCircle, Send, Layers3, Settings2, SlidersHorizontal, RotateCcw, Copy, Download} from 'lucide-react';
import {createPortal} from 'react-dom';
import content from './content.json';
import {OLD_PAGES,SERVICE_PAGES,loadBody} from 'virtual:page-index';
import LEGAL_SERVER from 'virtual:legal-texts';
import {ARTICLES,ARTICLES_INDEX,ARTICLES_PUBLISHED} from './articles.js';
import SectionNav from './SectionNav.jsx';
import {SCENES_MODE,SCENES_KEY,TWEAKS_CASES_KEY,TWEAKS_STILLS_KEY,TWEAKS_FOUNDER_KEY,CASES_STYLE_KEY,CASES_STYLE,THEME_KEY,THEME_SWITCHER,COOKIE_CONSENT_KEY,COOKIE_CONSENT_VERSION,YANDEX_METRIKA_ID,OFFICES,HEAD_OFFICE,OFFICE_HOURS} from './siteConfig.js';
import bottlingLineInstalled from './assets/media/case-1-bottling-line.webp';
import hvacTruck from './assets/media/hvac-truck.webp';
import refrigerationPlant from './assets/media/case-3-refrigeration.webp';
import mineMachinery from './assets/media/case-mine-machinery.webp';
import miningComplex from './assets/media/mining-complex.webp';
import nfDesertHaze from './assets/media/404-desert-haze.webp';
import routeConvoy from './assets/media/route-convoy.webp';
import routeRain from './assets/media/route-rain.webp';
import logoOnDark from './assets/media/logo-on-dark.webp';
import logoOnLight from './assets/media/logo-on-light.webp';
import founderPhoto from './assets/media/founder.webp';
import insurancePage from './assets/media/insurance-contract-page.webp';
import insuranceContract from './assets/files/dogovor-strahovaniya-2026-2027.pdf';

const {sections:S,services,cases,tabs,faq}=content;
const MotionContext=createContext(false);
const clean=s=>s?.replaceAll('<br>',' ')||'';
const Text=({value})=><>{clean(value)}</>;
// Source texts sometimes split two sentences with <br> and no full stop: a break before a capital letter
// becomes ". ", any other break a space.
const sentences=s=>(s||'').replace(/([^.!?:;,])\s*<br>\s*(?=[А-ЯЁA-Z])/g,'$1. ').replaceAll('<br>',' ');
// Case titles may carry a "[1]" marker: it becomes a superscript reference to footnote 1 in the footer
// (the source link itself lives there). The marker stays glued to the word before it; its digit is drawn by CSS
// so it never becomes part of the heading text that search engines read.
const CaseTitle=({title})=>{
  const [before,after]=clean(title).split('[1]');
  if(after===undefined)return <>{clean(title)}</>;
  const cut=before.lastIndexOf(' ')+1;
  return <>{before.slice(0,cut)}<span className="footnote-word">{before.slice(cut)}<sup className="footnote"><a href="#fn-1" id="fnref-1" aria-label="Сноска 1" data-n="1"></a></sup></span>{after}</>;
};
const FOOTNOTE_SOURCE=cases.find(c=>c.source)?.source;
const entries=(n,tag)=>S[n].entries.filter(e=>e.tag===tag).map(e=>e.text);
const sourceTitle=n=>S[n].H2;
const shortCTA='Получить стоимость и сроки';
const selection=['Перевозка и таможня','Только перевозка','Таможенное оформление','Нужна консультация'];
const scrollToRequest=()=>(document.querySelector('#request .form-detailed')||document.getElementById('request'))?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});

// Illustrations: WebGL scenes or still photos, chosen once per page load (see src/siteConfig.js).
const ScenesContext=createContext(SCENES_MODE);
// __HOSTING__ is true in the published single-file build: no settings page there, so 3D stays off and its
// code (Three.js and the globe data) is left out of the file altogether
const scenesMode=__HOSTING__?'images':(()=>{try{const v=localStorage.getItem(SCENES_KEY);if(v==='3d'||v==='images')return v;}catch{}return SCENES_MODE;})();
const STILLS={
  hero:{src:routeConvoy,w:1600,h:1073,alt:'Колонна грузовиков с оборудованием на горной дороге'},
  container:{src:routeRain,w:1600,h:1073,alt:'Тягач с промышленной линией на открытом полуприцепе'},
  winter:{src:routeConvoy,w:1600,h:1073,alt:'Колонна грузовиков с оборудованием на горной дороге'},
  hvac:{src:hvacTruck,w:1600,h:893,alt:'Тягач с климатическим оборудованием в упаковочной плёнке'},
  turbine:{src:miningComplex,w:1280,h:851,alt:'Горнопроходческий комплекс в цехе завода'},
};
function Picture({src,w,h,alt,eager=false}){
  return <picture><img src={src} alt={alt} width={w} height={h} loading={eager?'eager':'lazy'} decoding="async"/></picture>;
}
function Scene(props){
  const mode=useContext(ScenesContext);
  if(!__HOSTING__&&mode!=='images')return <Scene3D {...props}/>;
  const still=STILLS[props.kind];
  const framed=props.kind==='hero'||props.kind==='end';
  return <div className={`scene scene-still ${props.className||''}`}>
    {!still?<div className="scene-fallback" aria-hidden="true"><Globe2 size={72} strokeWidth={1}/></div>
      :framed?<FramedPicture id={props.kind} photo={still} className="still-photo" eager={props.kind==='hero'}/>
      :<Picture {...still}/>}
  </div>;
}
function Scene3D({kind='hero',className='',label='Иллюстрация перевозки промышленного оборудования'}){
  const host=useRef(null),instance=useRef(null),reduced=useContext(MotionContext),reducedRef=useRef(reduced);reducedRef.current=reduced;
  const [failed,setFailed]=useState(false),[ready,setReady]=useState(false);
  // Build the scene as it approaches and release its WebGL context once it is far away,
  // so only the scenes near the viewport hold a context at the same time.
  useEffect(()=>{
    let cancelled=false,loading=false;const el=host.current;
    const release=()=>{instance.current?.dispose();instance.current=null;setReady(false);};
    const near=new IntersectionObserver(async([entry])=>{
      if(!entry.isIntersecting||instance.current||loading)return;loading=true;
      try{const {IndustrialScene}=await import('./Scene.js');if(!cancelled&&!instance.current)instance.current=new IndustrialScene(el,{kind,reduced:reducedRef.current,onReady:()=>setReady(true)});}catch{if(!cancelled)setFailed(true);}
      loading=false;
    },{rootMargin:'450px'});
    const far=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)release();},{rootMargin:'1400px'});
    near.observe(el);far.observe(el);
    return()=>{cancelled=true;near.disconnect();far.disconnect();release();};
  },[kind]);
  useEffect(()=>instance.current?.setReduced(reduced),[reduced]);
  return <div className={`scene ${className} ${ready?'is-ready':''}`} role="img" aria-label={label}>
    <div className="scene-host" ref={host}/>
    {!ready&&!failed&&<div className="scene-wait" aria-hidden="true"><Truck size={35}/><span>Загрузка 3D</span></div>}
    {failed&&<div className="scene-fallback"><Truck size={62} strokeWidth={1}/><p>Международная и внутренняя логистика</p><small>3D недоступно в этом браузере. Все разделы и формы работают.</small></div>}
    <span className="scene-credit">3D-иллюстрация</span>
  </div>;
}


// Framed photos (cases, plus the hero and closing stills in images mode). IMAGE_FRAMES holds the
// shipped framing; in dev the tweak panel overrides it live (kept in localStorage) and copies the
// values to paste back here. Which groups get a panel is switched on /3d.html.
const CASE_PHOTOS=[
  {src:miningComplex,w:1280,h:851,alt:'Горнопроходческий комплекс в цехе завода перед отгрузкой'},
  {src:mineMachinery,w:1280,h:960,alt:'Шахтная техника DERUI с подъёмной платформой у завода-изготовителя'},
  {src:bottlingLineInstalled,w:1280,h:592,alt:'Линия розлива в собранном виде на заводе клиента',caption:'Линия в собранном виде на заводе клиента'},
  {src:refrigerationPlant,w:1280,h:960,alt:'Компрессорная холодильная станция и шкафы управления'},
];
const FRAME={width:100,height:375,ratio:'3/2',fit:'cover',zoom:1,posX:50,posY:50,offsetX:0,offsetY:0};
const IMAGE_FRAMES={case0:{...FRAME},case1:{...FRAME},case2:{...FRAME},case3:{...FRAME,posY:0},hero:{...FRAME,ratio:'auto',height:360},end:{...FRAME,ratio:'auto',height:420},founder:{...FRAME,ratio:'4/5',posY:25}};
const FRAME_LABELS={case0:'Кейс 1',case1:'Кейс 2',case2:'Кейс 3',case3:'Кейс 4',hero:'Первый экран',end:'Финальный блок',founder:'Фото основателя'};
const FRAMES_KEY='image-frames';
// Panels are opt-in: switched on per browser on /3d.html ('1'), hidden otherwise.
const tweakOn=key=>{try{return localStorage.getItem(key)==='1';}catch{return false;}};
const TWEAK_GROUPS=import.meta.env.DEV?{cases:tweakOn(TWEAKS_CASES_KEY),stills:tweakOn(TWEAKS_STILLS_KEY),founder:tweakOn(TWEAKS_FOUNDER_KEY)}:{cases:false,stills:false,founder:false};
const FramesContext=createContext({frames:IMAGE_FRAMES,setFrame:()=>{}});
const RATIOS=[['auto','По высоте'],['original','Исходные'],['16/9','16:9'],['3/2','3:2'],['4/3','4:3'],['1/1','1:1'],['21/9','21:9'],['4/5','4:5'],['3/4','3:4'],['2/3','2:3']];
function useImageFrames(){
  const [frames,setFrames]=useState(()=>{if(!import.meta.env.DEV)return IMAGE_FRAMES;try{const saved=JSON.parse(localStorage.getItem(FRAMES_KEY)||'{}');return Object.fromEntries(Object.entries(IMAGE_FRAMES).map(([k,f])=>[k,{...f,...(saved[k]||{})}]));}catch{return IMAGE_FRAMES;}});
  useEffect(()=>{if(!import.meta.env.DEV)return;try{localStorage.setItem(FRAMES_KEY,JSON.stringify(frames));}catch{}},[frames]);
  const setFrame=(id,next)=>setFrames(all=>({...all,[id]:typeof next==='function'?next(all[id]):next}));
  return {frames,setFrame};
}
function FramedPicture({id,photo,className,eager=false,children}){
  const {frames}=useContext(FramesContext);const t=frames[id];
  const ratio=t.ratio==='original'?`${photo.w}/${photo.h}`:t.ratio;
  const style={'--photo-w':`${t.width}%`,'--photo-h':ratio==='auto'?`${t.height}px`:'auto','--photo-ratio':ratio,'--photo-fit':t.fit,'--photo-zoom':t.zoom,'--photo-x':`${t.posX}%`,'--photo-y':`${t.posY}%`,'--photo-dx':`${t.offsetX}px`,'--photo-dy':`${t.offsetY}px`};
  return <figure className={className} style={style}><Picture {...photo} eager={eager}/>{children}</figure>;
}
const FOUNDER_PHOTO={src:founderPhoto,w:883,h:1280,alt:'Эдуард Хасанов, основатель КАСТОМС ЛИДЕР'};
function CasePhoto({i,children}){return <FramedPicture id={`case${i}`} photo={CASE_PHOTOS[i]} className="case-photo">{children}</FramedPicture>;}
function ImageTweaks(){
  const targets=[...(TWEAK_GROUPS.cases?['case0','case1','case2','case3']:[]),...(TWEAK_GROUPS.stills?['hero']:[]),...(TWEAK_GROUPS.founder?['founder']:[])];
  const {frames,setFrame}=useContext(FramesContext);
  const [open,setOpen]=useState(false),[copied,setCopied]=useState(false),[pick,setPick]=useState(targets[0]);
  if(!targets.length)return null;
  const id=targets.includes(pick)?pick:targets[0];const t=frames[id]||FRAME;const set=(k,v)=>setFrame(id,f=>({...f,[k]:v}));
  const range=(k,label,min,max,step,unit='')=><label className="tweak-row"><span>{label}<b>{t[k]}{unit}</b></span><input type="range" min={min} max={max} step={step} value={t[k]} onChange={e=>set(k,Number(e.target.value))}/></label>;
  const copy=async()=>{try{await navigator.clipboard.writeText(`const IMAGE_FRAMES=${JSON.stringify(frames)};`);setCopied(true);setTimeout(()=>setCopied(false),1600);}catch{}};
  return <div className={`photo-tweaks${open?' open':''}`}>
    <button type="button" className="tweak-toggle" onClick={()=>setOpen(!open)} aria-expanded={open}><SlidersHorizontal size={16}/>Изображения</button>
    {open&&<div className="tweak-body">
      <label className="tweak-row"><span>Изображение</span><select value={id} onChange={e=>setPick(e.target.value)}>{targets.map(k=><option key={k} value={k}>{FRAME_LABELS[k]}</option>)}</select></label>
      {(id==='hero'||id==='end')&&scenesMode!=='images'&&<p className="tweak-note">Эта картинка видна, когда 3D выключено на странице /3d.html.</p>}
      {range('width','Ширина',40,140,1,'%')}
      <label className="tweak-row"><span>Пропорции</span><select value={t.ratio} onChange={e=>set('ratio',e.target.value)}>{RATIOS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
      {t.ratio==='auto'&&range('height','Высота',160,760,5,'px')}
      <label className="tweak-row"><span>Заполнение</span><select value={t.fit} onChange={e=>set('fit',e.target.value)}><option value="cover">Обрезать по рамке</option><option value="contain">Вписать целиком</option></select></label>
      {range('zoom','Масштаб',1,2.5,0.05,'×')}
      {range('posX','Кадр по горизонтали',0,100,1,'%')}
      {range('posY','Кадр по вертикали',0,100,1,'%')}
      {range('offsetX','Сдвиг блока ←→',-300,300,1,'px')}
      {range('offsetY','Сдвиг блока ↑↓',-200,200,1,'px')}
      <div className="tweak-actions"><button type="button" onClick={copy}><Copy size={14}/>{copied?'Скопировано':'Скопировать значения'}</button><button type="button" onClick={()=>setFrame(id,IMAGE_FRAMES[id])}><RotateCcw size={14}/>Сбросить</button></div>
      <p className="tweak-note">Видно только в режиме разработки. Скопированная строка содержит рамки всех изображений — вставьте её вместо IMAGE_FRAMES в src/App.jsx.</p>
    </div>}
  </div>;
}
function Button({children,onClick,type='button',secondary=false,className='',...props}){
  return <button type={type} onClick={onClick} className={`button ${secondary?'secondary':''} ${className}`} {...props}>{children}<ArrowUpRight size={19}/></button>;
}
// "для вас это бесплатно" is the one offer worth spotting at a glance: the phrase is set in bold
// wherever a bullet list mentions it.
const FREE='для вас это бесплатно';
function BulletText({value}){
  const text=clean(value),at=text.indexOf(FREE);
  if(at<0)return text;
  return <>{text.slice(0,at)}<strong className="free-mark">{FREE}</strong>{text.slice(at+FREE.length)}</>;
}
function Bullets({items,className=''}){return <ul className={`bullets ${className}`}>{items.map((s,i)=><li key={i}><Check size={17}/><span><BulletText value={s}/></span></li>)}</ul>}
// Russian phone mask: +7 (999) 123-45-67. Typing, paste and iOS/Android autofill may bring
// 9991234567, 89991234567, 79991234567 or an already formatted number; all end up in the same format.
function phoneDigits(raw){
  const d=raw.replace(/\D/g,'');
  if(!d)return '';
  return (d[0]==='7'||d[0]==='8'?'7'+d.slice(1):'7'+d).slice(0,11);
}
function formatPhone(d){
  if(!d)return '';
  const n=d.slice(1);
  let out='+7';
  if(n.length)out+=' ('+n.slice(0,3);
  if(n.length>3)out+=') '+n.slice(3,6);
  if(n.length>6)out+='-'+n.slice(6,8);
  if(n.length>8)out+='-'+n.slice(8,10);
  return out;
}
function PhoneInput(props){
  const [value,setValue]=useState(''),input=useRef(null),caretAt=useRef(null);
  // Restore the caret after React writes the reformatted value (which would otherwise jump to the end).
  useLayoutEffect(()=>{const pos=caretAt.current;caretAt.current=null;if(pos!=null&&document.activeElement===input.current)input.current.setSelectionRange(pos,pos);});
  const change=e=>{
    const raw=e.target.value,caret=e.target.selectionStart??raw.length;
    let digits=phoneDigits(raw);
    // Count the digits left of the caret in the normalised number, so the caret stays put after reformatting.
    const rawDigits=raw.replace(/\D/g,'');
    let before=raw.slice(0,caret).replace(/\D/g,'').length+(rawDigits&&!/^[78]/.test(rawDigits)?1:0);
    // Backspace over a bracket, space or dash removes the digit before it instead of doing nothing.
    if(e.nativeEvent.inputType==='deleteContentBackward'&&digits===phoneDigits(value)&&before>1){
      digits=digits.slice(0,before-1)+digits.slice(before);before--;
    }
    const next=formatPhone(digits);
    setValue(next);
    if(caret>=raw.length)return;
    let pos=0,seen=0;
    while(pos<next.length&&seen<before){if(/\d/.test(next[pos]))seen++;pos++;}
    caretAt.current=pos;
    if(next===value)e.target.setSelectionRange(pos,pos);
  };
  return <input {...props} ref={input} type="tel" inputMode="tel" autoComplete="tel" value={value} onChange={change} maxLength={18} pattern="\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}" title="Номер полностью: +7 (999) 123-45-67"/>;
}
// Two-option radio choice styled like a field (legend as the label, options side by side).
function ChoiceGroup({legend,name,options,required=false}){
  return <fieldset className="transport-type"><legend>{legend}<Req on={required}/></legend><div className="transport-options">{options.map(([value,label])=><label key={value}><input type="radio" name={name} value={value} required={required}/><span>{label}</span></label>)}</div></fieldset>;
}
// Required "Тип перевозки" choice, shared by the short and the detailed request forms.
const TransportType=()=><ChoiceGroup legend="Тип перевозки" name="transport" required options={[['international','Международная'],['russia','По России']]}/>;
// Front-end checks for e-mail and INN: the message appears after the visitor leaves the field and is also
// set as the field's validity message, so the form cannot be sent with an invalid value.
const EMAIL_RE=/^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/;
const CHECKS={
  // Only Latin letters, digits and e-mail symbols can be typed: Cyrillic and spaces are dropped as you type
  email:{test:v=>EMAIL_RE.test(v),sanitize:v=>v.replace(/[^\x21-\x7E]/g,''),message:'Проверьте адрес почты, например: logist@company.ru',props:{type:'text',inputMode:'email',autoCapitalize:'off',spellCheck:false}},
  // INN: digits only, 10 for a company or 12 for a sole trader (no checksum, so any real number passes)
  inn:{test:v=>/^(\d{10}|\d{12})$/.test(v),sanitize:v=>v.replace(/\D/g,'').slice(0,12),message:'Проверьте ИНН: 10 цифр у организации, 12 — у ИП',props:{inputMode:'numeric',maxLength:12}},
};
function CheckedInput({check,errorId,onError,...props}){
  const [value,setValue]=useState(''),[shown,setShown]=useState(false),input=useRef(null);
  const bad=value!==''&&!check.test(value);
  useEffect(()=>{input.current?.setCustomValidity(bad?check.message:'');onError(shown&&bad);},[bad,shown,check,onError]);
  return <input {...props} {...check.props} ref={input} value={value} aria-invalid={shown&&bad?'true':undefined} aria-describedby={shown&&bad?errorId:undefined}
    onChange={e=>setValue(check.sanitize?check.sanitize(e.target.value):e.target.value)} onBlur={()=>setShown(true)}/>;
}
const Req=({on})=>on?<span className="req" aria-hidden="true">*</span>:null;
function Field({label,name,placeholder,type='text',required=false,textarea=false,hint}){
  const id=useId(),errorId=useId(),[error,setError]=useState(false),check=CHECKS[name];
  return <div className="field"><label htmlFor={id}>{label}<Req on={required}/></label>{textarea?<textarea id={id} name={name} required={required} placeholder={placeholder} rows={3}/>:type==='tel'?<PhoneInput id={id} name={name} required={required} placeholder={placeholder}/>:check?<CheckedInput check={check} errorId={errorId} onError={setError} id={id} name={name} type={type} required={required} placeholder={placeholder} autoComplete={name==='email'?'email':'off'}/>:<input id={id} name={name} type={type} required={required} placeholder={placeholder} autoComplete={name==='phone'?'tel':name==='name'?'name':name==='company'?'organization':'off'}/>}{error?<small className="field-error" id={errorId}>{check.message}</small>:hint&&<small>{hint}</small>}</div>
}

function Form({variant='short',id,chosen,setChosen,onLegal}){
  const [status,setStatus]=useState('idle'),[error,setError]=useState(''),[serviceError,setServiceError]=useState(false);const services=useRef(null);const serviceErrorId=useId();const [hintOpen,setHintOpen]=useState(false);const hintId=useId();const [cargoOpen,setCargoOpen]=useState(false);const cargoId=useId();const formRef=useRef(null);
  // Detailed form on desktop: stretch "Что нужно сделать?" so its bottom edge lines up with the submit button.
  useLayoutEffect(()=>{
    if(variant!=='detailed')return;
    const fit=()=>{
      const form=formRef.current,ta=form?.querySelector('.cargo-fields textarea'),email=form?.querySelector('button[type=submit]');
      if(!ta||!email)return;
      if(!matchMedia('(min-width: 651px)').matches){ta.style.height=ta.style.minHeight='';return;}
      const h=email.getBoundingClientRect().bottom-ta.getBoundingClientRect().top;
      ta.style.height=ta.style.minHeight=h>=90?`${Math.round(h)}px`:'';
    };
    fit();window.addEventListener('resize',fit);document.fonts?.ready.then(fit);
    return ()=>window.removeEventListener('resize',fit);
  },[variant]);const intro=useRef(null);
  // The estimate hint floats over the fields (no layout shift); close it on Escape or a click elsewhere.
  useEffect(()=>{
    if(!hintOpen)return;
    const away=e=>{if(!intro.current?.contains(e.target))setHintOpen(false);};
    const esc=e=>{if(e.key==='Escape')setHintOpen(false);};
    document.addEventListener('pointerdown',away);document.addEventListener('keydown',esc);
    return ()=>{document.removeEventListener('pointerdown',away);document.removeEventListener('keydown',esc);};
  },[hintOpen]);
  const consentId=useId();const detailed=variant==='detailed',callback=variant==='callback',russia=variant==='russia';
  const started=useRef(false);
  async function submit(e){
    e.preventDefault();setError('');
    const payload=Object.fromEntries(new FormData(e.currentTarget));payload.form=id||variant;if(detailed)payload.services=chosen;payload.page=location.href.split('#')[0];new URLSearchParams(location.search).forEach((v,k)=>{if(k.startsWith('utm_'))payload[k]=v;});
    if(detailed&&!chosen.length){setServiceError(true);services.current?.scrollIntoView({block:'center'});services.current?.querySelector('input')?.focus({preventScroll:true});return;}
    const endpoint=import.meta.env.VITE_LEAD_ENDPOINT;
    if(!endpoint){setStatus('demo');return;}
    setStatus('sending');
    try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw new Error();const data=await r.json();if(data.ok!==true)throw new Error();setStatus('success');const where={form:payload.form,page:location.pathname};track('lead_success',where);track(`lead_${payload.form.replace(/-/g,'_')}`,where);window.dispatchEvent(new CustomEvent('lead:success',{detail:{form:payload.form}}));}
    catch{setStatus('idle');track('form_error',{form:payload.form});setError('Не удалось отправить заявку. Попробуйте ещё раз или позвоните: +7 (903) 879-20-20.');}
  }
  if(status==='success')return <div className="success" role="status"><CircleCheck size={44}/><h3>Спасибо! Заявка отправлена</h3><p>Менеджер свяжется с вами в течение 1 часа</p></div>;
  return <form ref={formRef} className={`lead-form form-${variant} ym-hide-content ym-disable-keys`} onSubmit={submit} onFocusCapture={()=>{if(!started.current){started.current=true;track('form_start',{form:id||variant});}}} onInvalidCapture={e=>{if(detailed&&!cargoOpen&&e.target.closest('.cargo-body')){setCargoOpen(true);requestAnimationFrame(()=>formRef.current?.reportValidity());}}}>
    {!detailed&&!callback&&!russia&&<><p className="form-title">Получите стоимость<br/>и сроки доставки</p><p className="form-intro" ref={intro}>В предложении подготовим маршрут, срок, стоимость и состав платежей. <button type="button" className="estimate-toggle" aria-expanded={hintOpen} aria-controls={hintId} onClick={()=>setHintOpen(o=>!o)}><span>Что входит в расчёт</span><span className="estimate-q" aria-hidden="true">?</span></button><span className="estimate-note" id={hintId} hidden={!hintOpen}>Перевозка, таможенное оформление и платежи готовим в одном предложении.<br/>Фиксируем состав работ, а также возможные дополнительные расходы, условия возникновения которых, обозначаем отдельно</span></p></>}
    {detailed&&(
      <fieldset ref={services} className="service-choices" aria-describedby={serviceError?serviceErrorId:undefined}><legend>Выберите услугу</legend><div className="choice-grid">{selection.map((name,i)=>{const Icon=[Layers3,Truck,FileCheck2,MessageCircle][i];return <label key={name} className={chosen.includes(name)?'selected':''}><input type="radio" name="services" value={name} checked={chosen.includes(name)} onChange={()=>{setServiceError(false);setChosen([name]);}}/><Icon className="svc-icon" size={26} strokeWidth={1.5} aria-hidden="true"/><span><strong>{name}</strong><small>{['Поставка под ключ','Международная или по РФ','В том числе с вашим перевозчиком','Сложная ситуация или вопрос'][i]}</small></span><span className="svc-check" aria-hidden="true"><Check size={14} strokeWidth={2.6}/></span></label>})}</div>{serviceError&&<p className="form-error service-error" id={serviceErrorId} role="alert">Выберите услугу.</p>}</fieldset>
    )}
    <div className={detailed?'form-columns':''}>
      <fieldset><legend className={detailed?'':'sr-only'}>{detailed?'О вас и компании':'Контактные данные'}</legend>
        {!detailed&&!callback&&!russia&&<><TransportType/><Field label="Что и куда доставить?" name="message" textarea required placeholder="Опишите своими словами. Например: линия розлива из Циндао в Тулу"/></>}
                {(detailed||callback||russia)&&<Field label="Ваше имя" name="name" required placeholder="Как к вам обращаться?"/>}
        {detailed&&<><Field label="Компания" name="company" required placeholder="Название вашей организации"/><Field label="ИНН компании" name="inn" required placeholder="10 или 12 цифр" hint="Для подготовки предложения на вашу организацию."/></>}
        <div className={detailed?'field-pair':''}><Field label="Укажите телефон" name="phone" type="tel" required placeholder="+7 (900) 000-00-00"/>{detailed&&<Field label="Укажите почту" name="email" type="email" required placeholder="logist@company.ru"/>}</div>
        {callback&&<Field label="Компания и должность" name="company" placeholder="Например: ООО «Компания», логист"/>}
        {russia&&<><div className="field-pair"><Field label="Откуда забрать?" name="origin" placeholder="Например: Тула"/><Field label="Куда доставить?" name="destination" placeholder="Например: Казань"/></div><Field label="Тип груза / задачи" name="cargo" placeholder="Например: линия розлива"/><Field label="Компания" name="company" placeholder="Название вашей организации"/></>}
        <input className="hp-field" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
        <div className="consent"><input id={consentId} type="checkbox" name="consent" required/><label htmlFor={consentId}>Я даю <a href="#" className="consent-link" role="button" onClick={e=>{e.preventDefault();onLegal('consent');}}>согласие на обработку персональных данных</a></label></div>
        <Button type="submit" className={callback?'':'cta-quote'} disabled={status==='sending'}>{status==='sending'?<><LoaderCircle className="spinner" size={18}/>Отправка…</>:callback?'Заказать звонок':detailed?<span>Получить стоимость и сроки<span className="btn-break"> по моей задаче</span></span>:shortCTA}</Button><p className="form-legal">Нажимая на кнопку, вы подтверждаете, что ознакомлены с <a href={POLICY_PATH} className="consent-link" onClick={e=>{e.preventDefault();onLegal('personal-data');}}>Политикой обработки персональных данных</a></p>
        {status==='demo'&&<p className="form-feedback" role="status">Форма заполнена. В локальной версии отправка ещё не подключена. Свяжитесь с нами: <a href="tel:+79038792020">+7 (903) 879-20-20</a>.</p>}
        {error&&<p className="form-error" role="alert">{error}</p>}
      </fieldset>
      {detailed&&<fieldset className={`cargo-fields${cargoOpen?' is-open':''}`}><legend><span>О грузе и маршруте</span><button type="button" className="cargo-toggle" aria-expanded={cargoOpen} aria-controls={cargoId} onClick={()=>setCargoOpen(o=>!o)}>{cargoOpen?<Minus size={16}/>:<Plus size={16}/>}{cargoOpen?'Свернуть':'Раскрыть'}</button></legend><div className="cargo-body" id={cargoId}><TransportType/><div className="field-pair"><Field label="Тип груза" name="cargo" required placeholder="Например: линия розлива"/><ChoiceGroup legend="Негабаритный груз?" name="oversized" required options={[['да','Да'],['нет','Нет']]}/></div><div className="field-pair"><Field label="Откуда забрать?" name="origin" required placeholder="Например: Гонконг"/><Field label="Куда доставить?" name="destination" required placeholder="Например: Казань"/></div><div className="field-pair"><Field label="Вес" name="weight" required placeholder="Например: 24 т"/><Field label="Упаковка" name="packaging" required placeholder="Например: контейнер, паллеты"/></div><Field label="Что нужно сделать?" name="message" textarea placeholder="Дополнительная информация о грузе своими словами"/></div></fieldset>}
    </div>
  </form>;
}

// Legal documents live as Markdown in src/legal/. The renderer covers what they use:
// "##" headings, paragraphs, "- " lists, **bold**, `code` and [[placeholders]] still to be filled in.
// Legal documents load when they are opened (a popup or a policy page); the server render has them all at once
const LEGAL_FILES={privacy:'privacy-policy','personal-data':'personal-data-policy',consent:'consent',cookies:'cookie-policy',analytics:'analytics-consent'};
const LEGAL_LAZY=import.meta.glob('./legal/*.md',{query:'?raw',import:'default'});
const LEGAL_TEXTS={...LEGAL_SERVER};
const loadLegal=async type=>LEGAL_TEXTS[type]??=await LEGAL_LAZY[`./legal/${LEGAL_FILES[type]}.md`]();
function useLegal(type){
  const [text,setText]=useState(()=>LEGAL_TEXTS[type]);
  useEffect(()=>{if(type&&!text&&LEGAL_FILES[type])loadLegal(type).then(setText);},[type,text]);
  return text;
}
const inlineMd=text=>text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[\[[\s\S]+?\]\])/g).map((part,i)=>
  part.startsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>
  :part.startsWith('`')?<code key={i}>{part.slice(1,-1)}</code>
  :part.startsWith('[[')?<mark key={i} className="legal-todo">{part.slice(2,-2)}</mark>
  :part);
// Section headings are h3 in the popup (its title is the h2) and h2 on a page of their own, under its h1
function LegalDoc({source,level=3}){
  const H=`h${level}`;
  return <div className="legal-doc">{source.trim().split(/\n{2,}/).map((block,i)=>{
    if(block.startsWith('# '))return null;
    if(block.startsWith('## '))return <H key={i}>{inlineMd(block.slice(3))}</H>;
    const lines=block.split('\n');
    if(lines.every(l=>l.startsWith('- ')))return <ul key={i}>{lines.map((l,j)=><li key={j}>{inlineMd(l.slice(2))}</li>)}</ul>;
    return <p key={i}>{inlineMd(lines.join(' '))}</p>;
  })}</div>;
}

function Modal({type,onClose,onLegal}){
  const dialog=useRef(null);
  useEffect(()=>{if(['hero','callback','russia'].includes(type))track(`open_${type}`);},[type]);
  useEffect(()=>{
    const d=dialog.current;d?.showModal();
    // Open with focus on the dialog itself, not on the close button, so no focus ring shows on arrival
    d?.focus({preventScroll:true});
    const old=document.body.style.overflow;document.body.style.overflow='hidden';
    // The full-screen forms on phones paint the status bar in their own light surface
    // iOS Safari tints the status bar from the page background, not only theme-color: repaint html and body too
    const meta=document.querySelector('meta[name="theme-color"]'),oldColor=meta?.content;
    const root=document.documentElement,body=document.body,oldBg=[root.style.backgroundColor,body.style.backgroundColor];
    if(['hero','callback','russia'].includes(type)&&d&&matchMedia('(max-width:650px)').matches){
      const surface=getComputedStyle(d).backgroundColor;
      setThemeColor(surface);root.style.backgroundColor=surface;body.style.backgroundColor=surface;
    }
    return()=>{document.body.style.overflow=old;setThemeColor(oldColor);root.style.backgroundColor=oldBg[0];body.style.backgroundColor=oldBg[1];};
  },[]);
  const titles={hero:'Получите стоимость и сроки доставки',callback:'Заказать звонок',russia:'Нужна перевозка по России?',consent:'Согласие на обработку персональных данных',privacy:'Политика конфиденциальности','personal-data':'Политика в отношении обработки персональных данных',analytics:'Согласие на обработку данных для веб-аналитики',cookies:'Политика использования cookie'};
  const isDoc=type in LEGAL_FILES,doc=useLegal(isDoc?type:null);
  return <dialog ref={dialog} tabIndex={-1} className={`modal modal-${type}${isDoc?' modal-doc':''}`} onCancel={onClose} aria-labelledby={`modal-title-${type}`} onClick={e=>{if(e.target===dialog.current)onClose();}}><div className="modal-inner"><button className="close-button" onClick={onClose} aria-label="Закрыть окно"><X/></button><h2 id={`modal-title-${type}`}>{titles[type]}</h2>{type==='hero'?<Form id="hero-modal" onLegal={onLegal}/>:['callback','russia'].includes(type)?<Form variant={type} onLegal={onLegal}/>:<LegalDoc source={doc||''}/>}</div></dialog>;
}

// The first screen's call to action stays on screen: once its button reaches the top edge, a copy
// takes over at the same place and width, pinned to the top, and opens the first-screen form in a popup.
// It steps aside while one of the page's own request forms is on screen.
// Case pills: scroll to where a case starts in the flow (cases are sticky, so their live position can't be used)
function goToCase(i){
  const list=document.querySelector('.case-list');if(!list)return;
  const items=[...list.children];
  const top=list.getBoundingClientRect().top+scrollY+items.slice(0,i).reduce((sum,c)=>sum+c.offsetHeight,0);
  scrollTo({top,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
function StickyCta({onOpen,hidden}){
  const [box,setBox]=useState(null);
  useEffect(()=>{
    let frame=null;
    const check=()=>{
      frame=null;
      const src=[...document.querySelectorAll('.hero-form button[type=submit], .mobile-hero-action')].find(b=>b.offsetParent);
      if(!src){setBox(null);return;}
      const r=src.getBoundingClientRect();
      // Not needed while another request form is already on screen
      const formInView=[...document.querySelectorAll('.final-request .lead-form, #request .lead-form')].some(f=>{const b=f.getBoundingClientRect();return b.top<innerHeight-80&&b.bottom>80;});
      // Phones: a floating pill at the bottom once the first-screen button has left the screen
      const phone=matchMedia('(max-width:650px)').matches;
      const next=(phone?r.bottom<=0:r.top<=12)&&!formInView?{left:Math.round(r.left),width:Math.round(r.width),phone}:null;
      // re-render only when something actually changed
      setBox(prev=>(prev===next||(prev&&next&&prev.left===next.left&&prev.width===next.width&&prev.phone===next.phone))?prev:next);
    };
    const queue=()=>{if(!frame)frame=requestAnimationFrame(check);};
    addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);queue();
    return()=>{removeEventListener('scroll',queue);removeEventListener('resize',queue);cancelAnimationFrame(frame);};
  },[]);
  const shown=box&&!hidden;
  // Keep the last position while fading out, so the hidden button never jumps to the left edge
  const last=useRef(null);if(box)last.current=box;const at=box||last.current;
  return <div className={`sticky-cta${shown?' is-shown':''}`} style={at&&!at.phone?{left:at.left,width:at.width}:undefined} aria-hidden={shown?undefined:'true'}>
    <Button className="cta-quote" onClick={onOpen} tabIndex={shown?0:-1}><span className="cta-long">Получить стоимость и сроки</span><span className="cta-short">Получить расчёт</span></Button>
  </div>;
}

function Journey({onRequest}){
  const [active,setActive]=useState(0);const item=tabs[active];const stops=useRef(null);
  // Fill the route line up to the active stop's dot, measured so it lands on the dot at any width.
  useEffect(()=>{
    const el=stops.current;if(!el)return;
    const place=()=>{const dot=el.querySelectorAll('i')[active];if(!dot||!el.clientWidth)return;const d=dot.getBoundingClientRect(),r=el.getBoundingClientRect();el.style.setProperty('--route-fill',((d.left+d.width/2-r.left)/r.width).toFixed(4));};
    place();const ro=new ResizeObserver(place);ro.observe(el);return()=>ro.disconnect();
  },[active]);
  return <section className="section journey" data-reveal><div className="wrap"><h2>{clean(sourceTitle(6))}</h2><div className="tabs" role="tablist" aria-label="Этапы поставки" style={{'--active':active}}><span className="tab-indicator" aria-hidden="true"/>{tabs.map((tab,i)=><button key={tab.label} role="tab" id={`tab-${i}`} aria-controls={`panel-${i}`} aria-selected={active===i} tabIndex={active===i?0:-1} onClick={()=>setActive(i)} onKeyDown={e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%4;else if(e.key==='ArrowLeft')n=(i+3)%4;else if(e.key==='Home')n=0;else if(e.key==='End')n=3;else return;e.preventDefault();setActive(n);document.getElementById(`tab-${n}`).focus();}}><span className="tab-dot"/>{tab.label}<ArrowRight size={18}/></button>)}</div><div className="journey-panel" id={`panel-${active}`} role="tabpanel" aria-labelledby={`tab-${active}`} tabIndex={0}><div key={active} className="journey-copy"><p className="journey-title">{item.title}</p><p>{item.text}</p><Bullets items={item.list}/><p className="note"><Info size={19}/>{item.note}</p><Button className="cta-quote" onClick={onRequest}>{shortCTA}</Button></div><div className="journey-visual"><Scene key={active} kind={['container','winter','hvac','turbine'][active]}/><div className="route-stops" ref={stops}><span className="route-fill" aria-hidden="true"/>{tabs.map((t,i)=><span key={i} className={i<=active?'passed':''}><i/>{t.label}</span>)}</div></div></div>
    {/* Phones: the four stages as swipeable text cards, each headed by its stage name; the CTA sticks to the screen bottom */}
    <div className="journey-cards" role="list" aria-label="Этапы поставки">{tabs.map((tab,i)=><article className="journey-card" role="listitem" key={tab.label}>
      <p className="journey-stage"><span className="journey-stage-step">{i+1} / {tabs.length}</span><span className="journey-stage-name">{tab.label}</span></p>
      <h3>{tab.title}</h3><p>{tab.text}</p><Bullets items={tab.list}/><p className="note"><Info size={19}/>{tab.note}</p>
    </article>)}</div>
  </div></section>;
}

// Cookie consent: a versioned record in localStorage. Without YANDEX_METRIKA_ID the notice only informs
// (the site sets no cookies); with it, it asks, and Metrika loads only after "Принять все".
// The footer link "Настройки cookie" reopens it.
const readCookieConsent=()=>{try{const c=JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY)||'null');return c&&c.v===COOKIE_CONSENT_VERSION?c:null;}catch{return null;}};
// Webvisor records how the page is used but never what is typed: forms carry ym-hide-content and
// ym-disable-keys, and form recording is off in the counter settings
function loadMetrika(id){
  if(!id||window.ym)return;
  window.ym=function(){(window.ym.a=window.ym.a||[]).push(arguments);};window.ym.l=Date.now();
  const script=document.createElement('script');script.async=true;script.src='https://mc.yandex.ru/metrika/tag.js';document.head.appendChild(script);
  window.ym(id,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
}
const ANALYTICS_ON=Boolean(YANDEX_METRIKA_ID);
function loadAnalytics(){loadMetrika(YANDEX_METRIKA_ID);}
// Metrika goals (JavaScript events). Nothing is sent until the visitor has agreed and the counter is loaded.
function track(goal,params){if(YANDEX_METRIKA_ID&&window.ym)window.ym(YANDEX_METRIKA_ID,'reachGoal',goal,params);}
function clearAnalyticsCookies(){document.cookie.split(';').map(c=>c.split('=')[0].trim()).filter(n=>n.startsWith('_ym')).forEach(n=>{document.cookie=`${n}=; Max-Age=0; path=/`;document.cookie=`${n}=; Max-Age=0; path=/; domain=.${location.hostname}`;});try{Object.keys(localStorage).filter(k=>k.startsWith('_ym')).forEach(k=>localStorage.removeItem(k));}catch{}}
// Consent journal on the server (api/consent.php): the visitor's random ID, time, document version and choice,
// so the operator can show when consent was given or withdrawn. Off where no endpoint is configured.
const newConsentId=()=>crypto.randomUUID?.()??'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
function logConsent(record,before){
  const endpoint=import.meta.env.VITE_CONSENT_ENDPOINT;if(!endpoint)return;
  const body=JSON.stringify({id:record.id,version:record.v,choice:record.analytics?'all':'necessary',previous:before?(before.analytics?'all':'necessary'):''});
  fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
}
function CookieNotice({onClose,onPolicy,onConsent,startInSettings=false}){
  const analytics=ANALYTICS_ON;
  // Settings: the necessary storage is always on; the Yandex Metrica switch starts on (the owner's choice)
  // until the visitor has saved a choice, then it shows that choice. Metrica still loads only after a button is pressed.
  const [settings,setSettings]=useState(startInSettings&&analytics);
  const [metrica,setMetrica]=useState(()=>{const saved=readCookieConsent();return saved?!!saved.analytics:true;});
  function choose(allowAnalytics){
    const before=readCookieConsent();
    // the ID outlives policy versions, so one visitor's choices line up in the journal
    let id;try{id=JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY)||'null')?.id;}catch{}
    const record={v:COOKIE_CONSENT_VERSION,analytics:allowAnalytics,at:new Date().toISOString(),id:id||newConsentId()};
    try{localStorage.setItem(COOKIE_CONSENT_KEY,JSON.stringify(record));}catch{}
    if(analytics)logConsent(record,before);
    if(allowAnalytics)loadAnalytics();
    else if(before?.analytics){clearAnalyticsCookies();location.reload();return;}
    onClose();
  }
  // Links, not buttons: a button can't wrap across lines inside running text
  const policy=<a href="#" role="button" className="cookie-policy-link" onClick={e=>{e.preventDefault();onPolicy();}}>Политике использования cookie</a>;
  // Fixed controls at the bottom of phones sit above the notice: publish its height
  const box=useRef(null);
  useEffect(()=>{const el=box.current;if(!el)return;const root=document.documentElement;const set=()=>root.style.setProperty('--cookie-h',`${el.offsetHeight+10}px`);set();const ro=new ResizeObserver(set);ro.observe(el);return()=>{ro.disconnect();root.style.removeProperty('--cookie-h');};},[]);
  return <aside className={`cookie-notice${analytics?' has-choice':''}`} aria-label="Уведомление о cookie" ref={box}>
    {analytics
      ?<p><strong className="cookie-lead">Помогите сделать сайт удобнее.</strong> Разрешите собирать статистику посещений и записи действий на страницах. Подробнее — в {policy} и <a href="#" role="button" className="cookie-policy-link" onClick={e=>{e.preventDefault();onConsent();}}>Согласии на обработку данных для аналитики</a>.</p>
      :<p>Сайт не устанавливает cookie: в браузере сохраняются только необходимые настройки. Подробнее — в {policy}.</p>}
    {settings&&<div className="cookie-settings">
      <div className="cookie-option"><div><strong>Необходимые</strong><span>Сохраняют ваш выбор и настройки сайта. Без них сайт не работает, поэтому они включены всегда.</span></div><label className="cookie-switch" title="Включены всегда"><input type="checkbox" role="switch" checked disabled aria-label="Необходимые: включены всегда"/><i aria-hidden="true"/></label></div>
      <div className="cookie-option"><div><strong>Яндекс Метрика</strong><span>Статистика, которая необходима для анализа поведения пользователей на сайте для улучшения сервиса. Сбор статистики происходит через Яндекс Метрика.</span></div><label className="cookie-switch"><input type="checkbox" role="switch" checked={metrica} onChange={e=>setMetrica(e.target.checked)} aria-label="Яндекс Метрика"/><i aria-hidden="true"/></label></div>
    </div>}
    <div className="cookie-actions">
      {analytics&&(settings
        ?<button type="button" className="cookie-secondary" onClick={()=>choose(metrica)}>Сохранить</button>
        :<button type="button" className="cookie-secondary" aria-expanded="false" onClick={()=>setSettings(true)}>Настройки</button>)}
      <button type="button" className="cookie-accept" onClick={()=>choose(analytics)}>{analytics?'Принять все':'Понятно'} <Check size={15}/></button>
    </div>
  </aside>;
}

// Client logos from customsleader.ru/clients, in the order of that page, with white backgrounds removed
// (assets/clients/logo-<company>.webp).
const CLIENT_FILES=import.meta.glob('./assets/clients/*.webp',{eager:true,import:'default'});
const CLIENT_NAMES=[['rek-tajms','Рек-Таймс'],['kip-servis','КИП Сервис'],['unteks-group','Ünteks Group'],['tm','ТМ'],['vivat','Виват'],['stellini','Stellini'],['promekspert','ПромЭксперт'],['welltex','Welltex'],['imer-concrete','IMER Concrete'],['vologodskij-tekstilnyj-kombinat','Вологодский текстильный комбинат'],['nacionalnyj-centr-zdorovya','Национальный центр здоровья'],['vdk','ВДК — Владимирская дверная компания'],['optima-dors','Оптима Дорс'],['impeks','Импэкс, фабрика дверей'],['maxdoors','MaxDoors'],['walsta','Walsta'],['asstra','ASSTRA'],['itcom','ITCOM'],['realeksport','РеалЭкспорт'],['pari','Пари, страховая компания'],['campanini','Campanini'],['fesco','FESCO'],['tranzit','Транзит'],['lorus-scm','Lorus SCM'],['vtp-servis-grupp','ВТП Сервис Групп']];
const CLIENTS=CLIENT_NAMES.map(([n,name])=>({n,name,src:CLIENT_FILES[`./assets/clients/logo-${n}.webp`]}));
function ClientLogos(){
  return <div className="clients"><h2>Наши клиенты и партнёры</h2><ul className="clients-grid">{CLIENTS.map(({n,name,src})=><li key={n} data-name={name}><img src={src} alt={name} loading="lazy" decoding="async"/></li>)}</ul></div>;
}

// Hero proof under the H1: the three benefits and a link to the NORDA case further down the page.
const INSURANCE_FILE='Договор страхования Кастомс Лидер 2026–2027.pdf';
// The single-file build inlines the PDF as data:, which browsers refuse to open in a new tab — serve it as a blob instead
function useFileUrl(src){
  const [url,setUrl]=useState(src);
  useEffect(()=>{
    if(!src.startsWith('data:'))return;
    let blobUrl;
    fetch(src).then(r=>r.blob()).then(b=>{blobUrl=URL.createObjectURL(b);setUrl(blobUrl);}).catch(()=>{});
    return()=>{if(blobUrl)URL.revokeObjectURL(blobUrl);};
  },[src]);
  return url;
}
function InsuranceDoc(){
  const pdf=useFileUrl(insuranceContract);
  return <figure className="insurance-art insurance-doc">
    <a className="insurance-doc-page" href={pdf} target="_blank" rel="noopener" aria-label="Открыть договор страхования в новой вкладке"><img src={insurancePage} alt="Первая страница договора страхования № 483-561-165567/26/FFW" width="620" height="878" loading="lazy" decoding="async"/></a>
    <figcaption>
      <span className="insurance-doc-kicker"><ShieldCheck size={16}/>Действующий договор</span>
      <dl><div><dt>Страховщик</dt><dd>СПАО «Ингосстрах»</dd></div></dl>
      <a className="button insurance-doc-download" href={pdf} download={INSURANCE_FILE}><Download size={18}/>Скачать PDF</a>
    </figcaption>
  </figure>;
}
const HERO_BENEFITS=[[ShieldCheck,'Более 20 лет работы в ВЭД'],[PackageCheck,'Сами работаем с поставщиками'],[Route,'Бюджет всей поставки известен заранее']];
function scrollToCase(e){
  e.preventDefault();
  goToCase(Math.max(0,cases.findIndex(c=>c.source)));
}
const CASE_LABEL="Смотреть кейс: 1'200 тонн и 160 метров, Китай → рудник Таймырский";
// The case link appears twice: under the benefits on desktop, over the photo on phones (CSS shows one).
function CaseLink({className}){
  return <a className={`hp-case ${className}`} href="#case-norda" onClick={scrollToCase} aria-label={CASE_LABEL}><span className="hc-body"><span className="hc-figs"><b>1'200 тонн</b> и <b>160 метров</b></span><span className="hc-route">Китай → рудник Таймырский</span></span><span className="hc-more">Смотреть кейс<ArrowDown size={18} aria-hidden="true"/></span></a>;
}
// Footer: four labelled columns on one grid (company, address, contact, documents), then the small print
function SiteFooter({showNote,home,here,setModal,setLegal,setCookieOpen}){
  const logo=<a href={home} className="wordmark ft-logo" aria-label="КАСТОМС ЛИДЕР — в начало"><img className="logo-on-dark" src={logoOnDark} alt="КАСТОМС ЛИДЕР" width="960" height="113" loading="lazy"/><img className="logo-on-light" src={logoOnLight} alt="КАСТОМС ЛИДЕР" width="960" height="112" loading="lazy"/></a>;
  const address=<a className="ft-address" href={mapLink(here)} target="_blank" rel="noopener noreferrer">{here.address}</a>;
  const callback=<button className="ft-callback" onClick={()=>setModal('callback')}>Заказать звонок <ArrowUpRight size={16}/></button>;
  const company=<span>ООО «КАСТОМС ЛИДЕР», ИНН 3702195282</span>;
  const disclaimer=<p className="ft-small">Информация на сайте носит справочный характер и не является публичной офертой (ст. 437 ГК РФ). Стоимость и сроки определяются индивидуальным расчётом и договором.</p>;
  const links=<div className="ft-links"><a href="/policy/privacy" onClick={e=>{e.preventDefault();setLegal('privacy');}}>Политика конфиденциальности</a><a href={POLICY_PATH} onClick={e=>{e.preventDefault();setLegal('personal-data');}}>Политика обработки персональных данных</a><button onClick={()=>setCookieOpen('settings')}>Настройки cookie</button></div>;
  const note=showNote&&FOOTNOTE_SOURCE&&<ol className="footnotes ft-small" aria-label="Сноски"><li id="fn-1">Источник: <a href={FOOTNOTE_SOURCE} target="_blank" rel="noopener noreferrer">«Норникель» запустил уникальный проходческий комплекс NORDA</a> <a href="#fnref-1" className="footnote-back" aria-label="Вернуться к тексту">↩</a></li></ol>;
  const label=t=><p className="ft-label">{t}</p>;
  return <footer className="footer wrap ft">
    <div className="ft-grid"><div className="ft-col">{label('Компания')}{logo}<p className="ft-small">{company}</p></div><div className="ft-col">{label('Адрес')}{address}</div><div className="ft-col">{label('Связаться')}{callback}<a className="ft-request" href="/request">Расчёт поставки</a></div><div className="ft-col">{label('Документы')}{links}</div></div>
    <div className="ft-row">{disclaimer}{note}</div>
  </footer>;
}
function HeroProof(){
  return <div className="hero-proof">
    <ul className="hp-benefits">{HERO_BENEFITS.map(([Icon,title])=><li key={title}><Icon aria-hidden="true"/>{title}</li>)}</ul>
    <CaseLink className="hp-case-story"/>
  </div>;
}

// Colour themes: Graphite (dark) is the main one, Steel is the light alternative. The sun/moon button in
// the header flips between them; the choice is stored per browser (THEME_KEY) and applied to <html>.
const THEMES={graphite:{tone:'dark'},steel:{tone:'light'}};
function readTheme(){
  if(!THEME_SWITCHER)return 'graphite';
  try{const v=localStorage.getItem(THEME_KEY);return v in THEMES?v:'graphite';}catch{return 'graphite';}
}
// Browser chrome (the phone status bar) takes this colour; keep it on the current surface
function setThemeColor(color){const meta=document.querySelector('meta[name="theme-color"]');if(meta&&color)meta.content=color;}
function applyTheme(id){
  const root=document.documentElement;
  root.dataset.theme=id;root.dataset.tone=THEMES[id].tone;
  setThemeColor(getComputedStyle(root).backgroundColor);
}

// Scroll reveal. Below the first screen, headings, text, media and grid items are tagged data-rv="kind"
// with a stagger index (--rv-i) and get .rv-in as they enter the viewport; .rv-done drops the reveal
// transitions afterwards so their own hover transitions come back (styles.css, "Scroll reveal").
// Hidden states apply only under html.rv-ready, which is never set for reduced motion.
// cases are skipped: they slide in over each other already, and fading their contents in on top of that
// started a burst of layer work right during the case change
const RV_SKIP='.lead-form,.modal,.cookie-notice,.tabs,.route-stops,.scene,label,button:not(.messengers>*),summary,.case-list';
const RV_TARGETS=[
  ['media','.case-visual,.journey-visual,.founder-media,.insurance-art'],
  ['item','.task-grid>article,.services-grid>article,.clients-grid>li,.team-roles>*,.founder-facts>*,.case-details>*,.messengers>*,.faq-list>details,.case-stat'],
  ['heading','h2,h3'],
  ['text','p,.bullets>li,.exclusions'],
];
function setupReveal(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return ()=>{};
  const scope=[...document.querySelectorAll('main > section:not(.hero)')],tagged=[];
  for(const [kind,selector] of RV_TARGETS)for(const section of scope)for(const el of section.querySelectorAll(selector)){
    if(el.closest(RV_SKIP)||el.parentElement.closest('[data-rv]')||el.hasAttribute('data-rv'))continue;
    el.dataset.rv=kind;tagged.push(el);
  }
  for(const el of tagged){
    let i=0;for(let sib=el.previousElementSibling;sib;sib=sib.previousElementSibling)if(sib.hasAttribute('data-rv'))i++;
    el.style.setProperty('--rv-i',Math.min(i,7));
  }
  // Position check on scroll rather than IntersectionObserver: it also runs where observers are paused
  // (background tabs, embedded previews), so nothing can stay hidden.
  const timers=new Set();let pending=[...tagged],queued=0;
  const reveal=el=>{
    el.classList.add('rv-in');
    const t=setTimeout(()=>{el.classList.add('rv-done');timers.delete(t);},1600+Number(el.style.getPropertyValue('--rv-i')||0)*90);timers.add(t);
  };
  const check=()=>{
    queued=0;const line=window.innerHeight*.92;
    pending=pending.filter(el=>{const r=el.getBoundingClientRect();if(r.top<line&&(r.bottom>0||r.top<0)){reveal(el);return false;}return true;});
  };
  const schedule=()=>{if(!queued)queued=setTimeout(check,50);};
  document.documentElement.classList.add('rv-ready');
  check();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  return ()=>{clearTimeout(queued);timers.forEach(clearTimeout);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);document.documentElement.classList.remove('rv-ready');};
}
// "Наверх": bottom-left, shown once the visitor is a screen below the top.
function ScrollTopButton(){
  const [shown,setShown]=useState(false);
  useEffect(()=>{
    let frame=0;
    const check=()=>{frame=0;setShown(window.scrollY>window.innerHeight);};
    const onScroll=()=>{if(!frame)frame=requestAnimationFrame(check);};
    check();window.addEventListener('scroll',onScroll,{passive:true});
    return ()=>{window.removeEventListener('scroll',onScroll);cancelAnimationFrame(frame);};
  },[]);
  const toTop=()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  return <button type="button" className={`scroll-top${shown?' is-shown':''}`} onClick={toTop} aria-label="Наверх" title="Наверх" tabIndex={shown?0:-1} aria-hidden={shown?undefined:'true'}><ArrowUp size={18}/></button>;
}

// Pages of the old customsleader.ru kept at their old addresses (src/oldPages.json, imported from the old site):
// search engines keep their weight when the new site replaces the old one. Each is drawn like the first screen,
// with the old page's text below it. The main page links to them from the small menu in the header.
const OLD_IMAGES=import.meta.glob('./assets/old-site/*',{eager:true,import:'default'});
const oldImage=name=>OLD_IMAGES[`./assets/old-site/${name}`];
const routeKey=p=>(p||'/').replace(/\.html$/,'').replace(/\/+$/,'').toLowerCase()||'/';
// Each case also has a page of its own at /cases/<slug>, so search engines can show it for its own queries
const CASE_SEO=[
  {slug:'dostavka-kompleksa-norda-na-taymyr',title:'Доставка комплекса Norda из Китая на Таймыр — КАСТОМС ЛИДЕР',description:'Как доставили горнопроходческий комплекс Norda длиной 160 м из Китая на рудник Таймырский: 1 200 тонн, 11 000 км, 3 недели, растаможка 58 машин за 1 час.'},
  {slug:'dostavka-shahtnoy-tehniki-na-taymyr',title:'Доставка шахтной техники из Китая на Таймыр — КАСТОМС ЛИДЕР',description:'Как в летний пик речных перевозок доставили шахтную технику DERUI из Китая на рудник Таймырский: баржа от Красноярска до Дудинки за 7 дней.'},
  {slug:'dostavka-linii-rozliva-vody',title:'Доставка линии розлива воды из Китая — КАСТОМС ЛИДЕР',description:'Поставщик отказался везти линию розлива автотранспортом. Купили контейнеры в Китае, упаковали оборудование и доставили 16 машинами без повреждений и в бюджет.'},
  {slug:'oformlenie-klimaticheskoy-tehniki',title:'Таможенное оформление климатической техники — КАСТОМС ЛИДЕР',description:'Оборудование купили на рынке в Китае, документы не соответствовали товару, другие брокеры отказались. Собрали документальную базу и добились выпуска груза.'},
];
export const CASE_PAGES=cases.map((c,i)=>({kind:'case',i,path:`/cases/${CASE_SEO[i].slug}`,title:CASE_SEO[i].title,description:CASE_SEO[i].description,h1:c.title.replace('[1]',''),blocks:[{t:'p',html:c.description}]}));
// The personal data policy also has an address of its own (152-FZ asks for it to be published); on the site it still opens over the page
export const POLICY_PATH='/policy/personal-data';
// The request page: the old /form address leads here; the detailed form follows the text
const REQUEST_PAGE={"kind": "request", "path": "/request", "h1": "Расчёт поставки", "crumb": "Расчёт поставки", "title": "Расчёт стоимости доставки и таможенного оформления — КАСТОМС ЛИДЕР", "description": "Заявка на расчёт поставки: маршрут, срок, стоимость перевозки и таможенных платежей в одном предложении. Свяжемся в течение часа, расчёт — от 1 рабочего дня.", "blocks": [{"t": "p", "html": "Расскажите о грузе — подготовим маршрут, срок, стоимость перевозки и состав таможенных платежей в одном предложении. Менеджер свяжется с вами в течение 1 часа, расчёт — от 1 рабочего дня."}, {"t": "p", "html": "Коротко опишите задачу в форме справа или заполните <a href=\"#request\">подробную заявку</a> ниже."}, {"t": "h2", "text": "Как мы готовим расчёт"}, {"t": "ol", "items": ["Менеджер свяжется с вами в течение 1 часа после заявки и уточнит параметры груза.", "Таможенный аналитик определит код ТН ВЭД: от него зависят таможенные платежи и список разрешительных документов.", "Логист сформирует 1–3 маршрута — по сроку, стоимости и надёжности — и сравнит авиа, авто, ЖД и море.", "Вы получите предложение от 1 рабочего дня с окончательной ставкой от склада до склада."]}, {"t": "h2", "text": "Что входит в расчёт"}, {"t": "ul", "items": ["маршрут и полный срок до вашего склада или объекта;", "стоимость перевозки, включая перегрузки по маршруту;", "таможенные платежи и стоимость оформления;", "состав работ — фиксируем в предложении, а возможные дополнительные расходы и условия их возникновения обозначаем отдельно."]}, {"t": "h2", "text": "Что подготовить для заявки"}, {"t": "p", "html": "Достаточно того, что уже известно:"}, {"t": "ul", "items": ["откуда забрать груз и куда доставить;", "что везём: наименование и назначение оборудования;", "вес и объём, для негабарита — габариты и массу каждого места;", "когда груз нужен на месте;", "инвойс, спецификацию или коммерческое предложение поставщика, если они есть."]}, {"t": "p", "html": "Нет документов или поставщик не отвечает? Выберите в заявке «Нужна консультация»: мы сами запросим у поставщика инвойс, спецификацию и сведения об оборудовании."}, {"t": "p", "html": "Подробнее — в статьях «<a href=\"/articles/dokumenty-dlya-vvoza-oborudovaniya\">Документы для ввоза промышленного оборудования</a>» и «<a href=\"/articles/stoimost-vvoza-oborudovaniya\">Стоимость ввоза оборудования из Китая</a>»."}]};
// Page for addresses that no longer exist: the server answers 404 with 404.html (ErrorDocument in .htaccess)
const NOT_FOUND={kind:'notfound',path:'/404',h1:'К сожалению, эта страница больше недоступна',title:'Страница не найдена — КАСТОМС ЛИДЕР',description:'Страница не найдена: возможно, её перенесли или удалили. Перейдите на главную страницу КАСТОМС ЛИДЕР.',blocks:[]};
const LEGAL_PAGES=[{kind:'legal',path:POLICY_PATH,h1:'Политика обработки персональных данных',title:'Политика обработки персональных данных — КАСТОМС ЛИДЕР',description:'Политика ООО «КАСТОМС ЛИДЕР» в отношении обработки персональных данных: правовые основания, цели, сроки, меры безопасности и права субъектов персональных данных.',blocks:[]}];
// every page besides the main one: the old site's pages, the service pages, the cases, the articles contents, the articles and the policy
export const ROUTES=[...OLD_PAGES,...SERVICE_PAGES,...CASE_PAGES,ARTICLES_INDEX,...ARTICLES,...LEGAL_PAGES,REQUEST_PAGE,NOT_FOUND];
const PAGES=Object.fromEntries(ROUTES.map(p=>[routeKey(p.path),p]));
// Before the first render in the browser: the open page's text (and a policy page's document) is loaded, so the
// live page replaces the prerendered copy with the same content
export async function preparePage(){
  const page=pageFromPath();
  if(!page)return;
  await loadBody(page);
  if(page.kind==='legal')await loadLegal('personal-data');
  if(page.path==='/policy/privacy')await loadLegal('privacy');
}
const pageFromPath=()=>{if(typeof location==='undefined')return null;const forced=document.getElementById('root')?.dataset.route;return PAGES[routeKey(forced||location.pathname)]||null;};
// Site menu: the old site's pages grouped for search engines and people. Top items with a list open it on hover
// (desktop bar under the header) or show it as a group (phone panel); every link is in the page's HTML either way.
export const SITE_NAV=[
  {label:'Услуги',items:[['Доставка оборудования из Китая','/uslugi/dostavka-oborudovaniya'],['Негабаритные грузы','/uslugi/negabaritnye-gruzy'],['Доставка на Крайний Север','/uslugi/dostavka-na-krayniy-sever'],['Таможенное оформление','/tamozhennoe-oformlenie'],['Экспедирование и логистика','/i-logistika'],['Выпуск ЭЦП','/izgotovlenie-ecp'],['Селлерам','/uslugi/dostavka-dlya-sellerov']]},
  {label:'Перевозки',href:'/i-logistika',items:[['Мультимодальные перевозки','/ekspedirovanie/multimodalnye-perevozki'],['Авиаперевозки','/ekspedirovanie/aviaperevozki'],['Автомобильные перевозки','/ekspedirovanie/avtomobilnye-perevozki'],['Сборные перевозки','/ekspedirovanie/sbornye-perevozki']]},
  {label:'Проекты',href:'/cases'},
  {label:'Клиенты',href:'/clients'},
  {label:'Статьи',href:'/articles'},
  {label:'О компании',items:[['О нас','/about'],['Отзывы и рекомендации','/reviews'],['Правоустанавливающие документы','/documents']]},
  {label:'Контакты',items:[['Иваново','/contacts/ivanovo'],['Москва','/contacts/moscow'],['Владимир','/contacts/vladimir'],['Ярославль','/contacts/yaroslavl']]},
];
const isHere=(current,href)=>current&&routeKey(current)===routeKey(href);
// Desktop: an open bar under the header, aligned to the right
function SiteNav({current}){
  return <nav className="site-nav wrap" aria-label="Разделы сайта"><ul>{SITE_NAV.map(n=><NavItem key={n.label} n={n} current={current}/>)}</ul></nav>;
}
// A list opens under its item, text on the same left edge; near the right edge of the screen it opens leftwards instead
function fitSub(li){
  const sub=li.querySelector('.site-nav-sub');if(!sub)return;
  delete li.dataset.align;
  if(sub.getBoundingClientRect().right>document.documentElement.clientWidth-16)li.dataset.align='end';
}
function NavItem({n,current}){
  return <li className={n.items?'has-sub':undefined} onMouseEnter={n.items?e=>fitSub(e.currentTarget):undefined} onFocus={n.items?e=>fitSub(e.currentTarget):undefined}>
      {n.href?<a href={n.href} aria-current={isHere(current,n.href)||n.items?.some(([,h])=>isHere(current,h))||(n.href==='/articles'&&current?.startsWith('/articles/'))?'page':undefined}>{n.label}{n.items&&<ChevronDown size={14} aria-hidden="true"/>}</a>
        // a group without a page of its own only opens its list
        :<button type="button" className="site-nav-label" aria-haspopup="true" data-current={n.items?.some(([,h])=>isHere(current,h))||undefined}>{n.label}<ChevronDown size={14} aria-hidden="true"/></button>}
      {n.items&&<ul className="site-nav-sub">{n.items.map(([label,href])=><li key={href}><a href={href} aria-current={isHere(current,href)?'page':undefined}>{label}</a></li>)}</ul>}
    </li>;
}
// Phones: a small "Меню" button in the header with the same structure
function SiteMenu({current,theme,setTheme}){
  const [open,setOpen]=useState(false);const box=useRef(null);const id=useId();
  // the close button takes the place of the "Меню" button: the panel's first row starts where that button is
  const [top,setTop]=useState(18);
  const toggle=()=>{if(!open){const r=box.current?.querySelector('.site-menu-toggle')?.getBoundingClientRect();if(r)setTop(Math.max(8,Math.round(r.top+r.height/2-22)));}setOpen(o=>!o);};
  useEffect(()=>{
    if(!open)return;
    const away=e=>{if(!box.current?.contains(e.target))setOpen(false);};
    const key=e=>{if(e.key==='Escape')setOpen(false);};
    // full-screen on phones: the page underneath stays put while the menu is open
    const old=document.body.style.overflow;document.body.style.overflow='hidden';document.documentElement.classList.add('site-menu-open');
    document.addEventListener('pointerdown',away);document.addEventListener('keydown',key);
    return()=>{document.body.style.overflow=old;document.documentElement.classList.remove('site-menu-open');document.removeEventListener('pointerdown',away);document.removeEventListener('keydown',key);};
  },[open]);
  return <div className={`site-menu${open?' is-open':''}`} ref={box}>
    <button type="button" className="site-menu-toggle" aria-expanded={open} aria-controls={id} onClick={toggle}>Меню<ChevronDown size={15} aria-hidden="true"/></button>
    <nav className="site-menu-panel" id={id} aria-label="Разделы сайта" hidden={!open} style={{'--menu-top':`${top}px`}}>
      <div className="site-menu-top"><button type="button" className="site-menu-close" aria-label="Закрыть меню" onClick={()=>setOpen(false)}><X size={22}/></button>
      {THEME_SWITCHER&&setTheme&&<button type="button" className="site-menu-theme" onClick={()=>setTheme(t=>t==='graphite'?'steel':'graphite')}>{theme==='graphite'?<Sun size={18} aria-hidden="true"/>:<Moon size={18} aria-hidden="true"/>}{theme==='graphite'?'Светлая тема':'Тёмная тема'}</button>}</div>
      {SITE_NAV.map(n=><div key={n.label}><p className={n.items?undefined:'solo'}>{n.href?<a href={n.href} aria-current={isHere(current,n.href)?'page':undefined}>{n.label}</a>:n.label}</p>{n.items&&<ul>{n.items.map(([label,href])=><li key={href}><a href={href} aria-current={isHere(current,href)?'page':undefined}>{label}</a></li>)}</ul>}</div>)}
    </nav>
  </div>;
}
const plain=html=>(html||'').replace(/<br>/g,' ').replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').trim();
// Scans and letters: thumbnails that open full-screen over the page (arrows, Esc, a click on the dark area closes).
// The links stay real, so the full files are reachable without scripts too.
// Scans as thumbnails, or (cards) one card per letter: thumbnail, who wrote it, a quote and the signature
function Gallery({items,cards=false}){
  const [at,setAt]=useState(-1);const open=at>-1;
  useEffect(()=>{if(open)track('open_scan',{page:location.pathname});},[open]);
  useEffect(()=>{
    if(!open)return;
    const key=e=>{if(e.key==='Escape')setAt(-1);else if(e.key==='ArrowRight')setAt(i=>(i+1)%items.length);else if(e.key==='ArrowLeft')setAt(i=>(i-1+items.length)%items.length);};
    const old=document.body.style.overflow;document.body.style.overflow='hidden';document.documentElement.classList.add('site-menu-open');
    addEventListener('keydown',key);
    return()=>{removeEventListener('keydown',key);document.body.style.overflow=old;document.documentElement.classList.remove('site-menu-open');};
  },[open,items.length]);
  const im=items[at];
  return <>
    {(()=>{const thumb=(it,k)=><a href={oldImage(it.full||it.src)} onClick={e=>{e.preventDefault();setAt(k);}} aria-label={`Открыть: ${it.alt||'документ'} ${k+1} из ${items.length}`}><img src={oldImage(it.src)} alt={it.alt||''} loading="lazy"/></a>;
      return cards
        ?<ul className="review-list">{items.map((it,k)=><li key={it.src} className="review">{thumb(it,k)}<div className="review-text"><h2>{it.company}, {it.city}</h2><p className="review-meta">{it.about} · {it.kind}{it.date&&`, ${it.date}`}</p><blockquote>{it.quote}</blockquote><p className="review-sign">{it.signer}, ООО «{it.company}»</p></div></li>)}</ul>
        :<div className="page-gallery">{items.map((it,k)=><React.Fragment key={it.src}>{thumb(it,k)}</React.Fragment>)}</div>;})()}
    {open&&createPortal(<div className="viewer" role="dialog" aria-modal="true" aria-label={im.alt||'Документ'} onClick={e=>{if(e.target===e.currentTarget)setAt(-1);}}>
      <img src={oldImage(im.full||im.src)} alt={im.alt||''}/>
      <button type="button" className="viewer-close" aria-label="Закрыть" onClick={()=>setAt(-1)} autoFocus><X size={24}/></button>
      {items.length>1&&<><button type="button" className="viewer-prev" aria-label="Предыдущий" onClick={()=>setAt(i=>(i-1+items.length)%items.length)}><ArrowLeft size={24}/></button>
      <button type="button" className="viewer-next" aria-label="Следующий" onClick={()=>setAt(i=>(i+1)%items.length)}><ArrowRight size={24}/></button>
      <span className="viewer-count">{at+1} / {items.length}</span></>}
    </div>,document.body)}
  </>;
}
function PageBlocks({blocks}){
  const out=[];
  for(let i=0;i<blocks.length;i++){
    const b=blocks[i];
    if(b.t==='stats'){out.push(<ul className="page-stats" key={i}>{b.items.map(([v,l])=><li key={v}><strong>{v}</strong><span>{l}</span></li>)}</ul>);continue;}
    if(b.t==='reviews'){out.push(<Gallery key={i} items={b.items} cards/>);continue;}
    if(b.t==='img'){
      const run=[];while(blocks[i]?.t==='img')run.push(blocks[i++]);i--;
      out.push(<Gallery key={i} items={run}/>);
    }
    else if(b.t==='h2')out.push(<h2 key={i} id={b.id}>{b.text}</h2>);
    else if(b.t==='h3')out.push(<h3 key={i}>{b.text}</h3>);
    else if(b.t==='h4')out.push(<h4 key={i}>{b.text}</h4>);
    else if(b.t==='p')out.push(<p key={i} dangerouslySetInnerHTML={{__html:b.html}}/>);
    else if(b.t==='ul'||b.t==='ol'){const L=b.t;out.push(<L key={i}>{b.items.map((it,k)=><li key={k} dangerouslySetInnerHTML={{__html:it}}/>)}</L>);}
    else if(b.t==='table'&&b.kv)out.push(<div className={`page-table page-table-kv${b.price?' page-table-price':''}`} key={i}><table><tbody>{b.rows.map(([k,v])=><tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}</tbody></table></div>);
    else if(b.t==='table')out.push(<div className="page-table" key={i}><table>{b.head&&<thead><tr>{b.head.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead>}<tbody>{b.rows.map((r,k)=><tr key={k}>{r.map((c,j)=><td key={j} dangerouslySetInnerHTML={{__html:c}}/>)}</tr>)}</tbody></table></div>);
  }
  return out;
}
// 404: a short message over a full-screen photo
function NotFound({page}){
  useEffect(()=>{const t=setTimeout(()=>track('page_404',{url:location.pathname}));return()=>clearTimeout(t);},[]);
  return <section className="nf">
    <div className="nf-photos"><img src={nfDesertHaze} alt="Пустой контейнер в пустыне под тёмным небом" width="1672" height="941" fetchPriority="high" decoding="async"/></div>
    <div className="wrap nf-inner">
      <div className="nf-card"><p className="nf-code">Ошибка 404</p><h1>{page.h1}</h1><p>Возможно, её перенесли или удалили. Всё о доставке и таможенном оформлении — на главной странице.</p><a className="button cta-quote nf-home" href="/">На главную <ArrowRight size={18} aria-hidden="true"/></a></div>
      {/* phones: the message stays at the top, the button sits at the bottom in the middle */}
      <a className="button cta-quote nf-home nf-home-bottom" href="/">На главную <ArrowRight size={18} aria-hidden="true"/></a>
    </div>
  </section>;
}
function SubPage({page,office,setModal,setLegal}){
  const [chosen,setChosen]=useState([selection[0]]);
  const contacts=page.path.toLowerCase().startsWith('/contacts/');
  // the projects page shows the cases right on the first screen
  const projects=page.path==='/cases';
  // the privacy policy is a document to read: no form, all on the dark background
  const doc=page.path==='/policy/privacy'||page.kind==='legal';
  // the first paragraph becomes the lead under the heading, as on the main page
  const first=page.blocks.findIndex(b=>b.t==='p');
  const lead=page.lead?page.lead:first>-1&&first<3?plain(page.blocks[first].html):page.description;
  // "О нас": the whole text continues on the first screen, right after the introduction
  const inline=contacts||page.path==='/about'||page.path==='/reviews'||page.path==='/documents'||page.path==='/clients'||page.path.startsWith('/ekspedirovanie/')||page.path==='/i-logistika'||page.path==='/uslugi/dostavka-dlya-sellerov'||page.path==='/izgotovlenie-ecp'||page.path==='/tamozhennoe-oformlenie'||page.kind==='articles'||page.kind==='article'||page.kind==='case'||page.kind==='service'||page.kind==='request';
  const theCase=page.kind==='case'?cases[page.i]:null;
  const body=page.blocks.filter((_,i)=>i!==first||first>=3);
  const rest=inline?[]:body;
  // the articles contents list, or the end of an article (date, note, related reading)
  const extras=<>
    {theCase&&<>
      <div className={`case-stat page-case-stat ${/^\d/.test(theCase.stat)?'':'stat-words'}`}><strong>{theCase.stat}</strong>{theCase.label&&<span><Text value={theCase.label}/></span>}</div>
      <CasePhoto i={page.i}>{CASE_PHOTOS[page.i].caption&&<span className="photo-caption" aria-hidden="true">{CASE_PHOTOS[page.i].caption}</span>}</CasePhoto>
      {theCase.headings.map((h,k)=>{const cut=h.indexOf(':')+1;return <React.Fragment key={h}><h2><span className={`case-step${h.startsWith('Сложность')?' is-risk':''}`}>{h.slice(0,cut)}</span> {(t=>t.charAt(0).toUpperCase()+t.slice(1))(h.slice(cut).trim())}</h2><p>{theCase.paragraphs[k]}</p></React.Fragment>;})}
      {page.i<2&&<p className="article-meta">Как мы возим на Таймыр и по зимникам — <a href="/uslugi/dostavka-na-krayniy-sever">доставка на Крайний Север</a>.</p>}
      <aside className="article-related"><h2>Другие проекты</h2><ul>{CASE_PAGES.filter(c=>c.path!==page.path).map(c=><li key={c.path}><a href={c.path}>{c.h1}</a></li>)}</ul></aside>
    </>}
    {page.kind==='articles'&&<ol className="article-list">{ARTICLES.map(a=><li key={a.path}><h2><a href={a.path}>{a.h1}</a></h2><p>{a.description}</p></li>)}</ol>}
    {page.kind==='article'&&<>
      <p className="article-meta">Опубликовано {new Date(ARTICLES_PUBLISHED).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}. Материал справочный: требования к ввозу зависят от конкретного товара и условий сделки, поэтому перед поставкой их проверяют индивидуально.</p>
      {page.related.length>0&&<aside className="article-related"><h2>Читайте также</h2><ul>{page.related.map(r=><li key={r.path}><a href={r.path}>{r.title}</a></li>)}</ul></aside>}
    </>}
  </>;
  return <>
    <section className={`hero wrap page-hero${doc?' page-hero-doc':''}${inline?' page-hero-long':''}`}>
      <div className="hero-layout"><div className="hero-backdrop"><img src={miningComplex} alt="Горнопроходческий комплекс NORDA в цехе завода перед отгрузкой" width="1280" height="851" fetchPriority="high"/></div>
        <div className="hero-story"><nav className="crumbs" aria-label="Вы здесь"><a href="/">Главная</a><span aria-hidden="true">/</span>{page.kind==='article'&&<><a href="/articles">Статьи</a><span aria-hidden="true">/</span></>}{theCase&&<><a href="/cases">Наши проекты</a><span aria-hidden="true">/</span></>}<span>{page.kind==='articles'?'Статьи':page.crumb||(contacts?page.title:page.h1)}</span></nav><h1>{theCase?<CaseTitle title={theCase.title}/>:page.h1}</h1>{contacts&&<h2 className="page-address"><span>Адрес:</span><a className="page-address-line" href={mapLink(office)} target="_blank" rel="noopener noreferrer">{office.address}</a></h2>}{contacts&&<p className="page-hours">График работы: {OFFICE_HOURS.days}, {OFFICE_HOURS.opens}–{OFFICE_HOURS.closes}</p>}{projects?<div className="hero-projects">{CASE_PAGES.map(c=><article key={c.path}><h2><a href={c.path}>{c.h1}</a></h2><a className="hero-projects-more" href={c.path}>Как мы это сделали →</a></article>)}</div>:doc?null:<>{!(inline&&page.blocks[0]?.t!=='p')&&<p className="hero-lead">{lead}</p>}{inline&&<div className="page-body-dark page-inline"><div className="page-content"><PageBlocks blocks={body}/>{extras}</div></div>}</>}
          {!doc&&<Button className="mobile-hero-action cta-quote" onClick={()=>setModal('hero')}>{shortCTA}</Button>}</div>
        {!doc&&<div className="hero-form" id="hero-request"><Form id="hero" onLegal={setLegal}/></div>}</div>
    </section>
    {/* the same logo block as on the landing page, right after the text */}
    {page.path==='/clients'&&<section className="section clients-section page-clients" data-reveal><div className="wrap"><ClientLogos/></div></section>}
    {page.kind==='request'&&<section className="section request light" id="request"><div className="wrap"><div className="section-heading"><div><h2>Подробная заявка на расчёт</h2><p className="lead">Укажите, что уже известно. Если не определились с услугой или есть сложность, выберите консультацию, специалист поможет разобраться.</p></div></div><Form id="request" variant="detailed" chosen={chosen} setChosen={setChosen} onLegal={setLegal}/></div></section>}
    {(rest.length>0||doc)&&<section className={`section page-body page-body-dark${doc?' page-body-doc':''}`}><div className="wrap page-content">
      {doc?<LegalDoc source={LEGAL_TEXTS[page.kind==='legal'?'personal-data':'privacy']||''} level={2}/>:<PageBlocks blocks={rest}/>}
    </div></section>}
  </>;
}

// Which office the footer shows: /moscow → Moscow, anything else → the head office
const officeFromPath=()=>{const key=typeof location==='undefined'?'':location.pathname.replace(/\.html$|\/$/g,'').split('/').pop().toLowerCase();return OFFICES[key]?key:HEAD_OFFICE;};
// Yandex Maps search for the building: the office number is left out of the query
const mapLink=o=>o.map||`https://yandex.ru/maps/?text=${encodeURIComponent(o.address.replace(/\u00a0/g,' ').replace(/,\s*офис\s*\S+$/,''))}`;

export default function App({office=officeFromPath(),path}){
  const here=OFFICES[office]||OFFICES[HEAD_OFFICE];
  const page=path!==undefined?PAGES[routeKey(path)]||null:pageFromPath();
  const home=page?'/':'#';
  // the source footnote belongs to the pages that show the case title with its marker: the main page and the case page
  const showNote=!page||(page.kind==='case'&&!!cases[page.i]?.source);
  const [theme,setTheme]=useState(readTheme);
  useLayoutEffect(()=>{applyTheme(theme);try{if(THEME_SWITCHER)localStorage.setItem(THEME_KEY,theme);}catch{}},[theme]);
  const [modal,setModal]=useState(null),[legal,setLegal]=useState(null),[selected,setSelected]=useState([selection[0]]),[notice,setNotice]=useState('');
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const imageFrames=useImageFrames();
  const [cookieOpen,setCookieOpen]=useState(()=>!readCookieConsent());
  useEffect(()=>{try{localStorage.removeItem('customs-cookie-choice');}catch{}if(readCookieConsent()?.analytics)loadAnalytics();},[]);
  // Contact, map and document goals, caught once for the whole page
  useEffect(()=>{
    const goals=[['a[href^="tel:"]','click_phone'],['a[href^="mailto:"]','click_email'],['a[href*="wa.me/"]','click_whatsapp'],['a[href*="t.me/"]','click_telegram'],['.messenger-max','click_max'],['.insurance-doc-page,.insurance-doc-download','open_insurance'],['a[href*="yandex.ru/maps"]','click_map']];
    const onClick=e=>{const hit=goals.find(([sel])=>e.target.closest?.(sel));if(hit)track(hit[1]);};
    document.addEventListener('click',onClick);return()=>document.removeEventListener('click',onClick);
  },[]);
  // Full-bleed hero photos extend under the header; keep its height in --header-h, measured before the first paint
  // (a layout effect), so the photo is in place from the first frame instead of moving once the page is drawn;
  // together with the menu bar under it on desktop (hidden on phones)
  useLayoutEffect(()=>{const h=document.querySelector('.header');if(!h)return;const nav=document.querySelector('.site-nav');const set=()=>{const last=nav&&nav.offsetParent?nav:h;document.documentElement.style.setProperty('--header-h',`${Math.round(last.getBoundingClientRect().bottom-h.getBoundingClientRect().top)}px`);};set();const ro=new ResizeObserver(set);ro.observe(h);if(nav)ro.observe(nav);return()=>ro.disconnect();},[]);
  const noticeTimer=useRef(null);
  // Temporary: picking how the cases are separated from each other
  // Case style is picked on the settings page (/3d.html); the site only reads it
  const [casesV]=useState(()=>{if(__HOSTING__)return CASES_STYLE;try{const v=localStorage.getItem(CASES_STYLE_KEY);return ['stack','cover'].includes(v)?v:CASES_STYLE;}catch{return CASES_STYLE;}});
  // Cases stack: each one pins once its bottom reaches the bottom of the screen, so the next case slides over it whole,
  // and the case underneath darkens as it is covered
  useEffect(()=>{
    const list=document.querySelector('.case-list');if(!list)return;
    const items=[...list.children];
    const place=()=>items.forEach(c=>{c.style.top=`${Math.min(0,innerHeight-c.offsetHeight)}px`;});
    // (opacity of a dedicated layer only: no style recalculation of the case's content while scrolling)
    const shades=items.map(c=>c.querySelector('.case-dim'));let frame=0;
    const dim=()=>{frame=0;items.forEach((c,k)=>{const next=items[k+1],shade=shades[k];if(!shade)return;const p=next?Math.min(1,Math.max(0,(innerHeight-next.getBoundingClientRect().top)/innerHeight)):0;const o=(p*.7).toFixed(3);if(shade.style.opacity!==o)shade.style.opacity=o;});};
    const onScroll=()=>{if(!frame)frame=requestAnimationFrame(dim);};
    place();const ro=new ResizeObserver(place);items.forEach(c=>ro.observe(c));addEventListener('resize',place);addEventListener('scroll',onScroll,{passive:true});onScroll();
    return()=>{ro.disconnect();removeEventListener('resize',place);removeEventListener('scroll',onScroll);cancelAnimationFrame(frame);items.forEach(c=>c.style.removeProperty('top'));shades.forEach(d=>d&&(d.style.opacity=''));};
  },[casesV]);
  // Case photos are fetched and decoded ahead of time (once the page is idle), so the first case change never
  // waits for a large image to arrive and be decoded in the middle of the slide
  useEffect(()=>{
    const warm=()=>document.querySelectorAll('.case-list img').forEach(img=>{img.loading='eager';img.decode?.().catch(()=>{});});
    const id=window.requestIdleCallback?requestIdleCallback(warm,{timeout:2500}):setTimeout(warm,1500);
    return()=>{window.cancelIdleCallback?cancelIdleCallback(id):clearTimeout(id);};
  },[]);
  // Full-page scrolling on desktops: every case fills one screen and one wheel gesture moves the page to the start of
  // the next (or previous) case and stops there; the rest of the gesture's momentum is swallowed. Approaching from above catches the first
  // case once 80% of it is on screen; past the last one and above the first one the page scrolls normally. Phones keep plain scrolling, since a
  // case there is taller than the screen.
  useEffect(()=>{
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const list=document.querySelector('.case-list');if(!list)return;
    // The wheel listener sits on the cases section only, not on the window: a non-passive wheel listener makes the
    // browser run scrolling through the main thread wherever it applies, so elsewhere the page keeps fast scrolling
    const zone=list.closest('section');
    let starts=[],anim=0,animEnd=0,animTarget=0,locked=false,lockTimer=0,lockSince=0,lastAbs=0,lastAt=0,lockDir=0;
    const enabled=()=>matchMedia('(min-width:901px)').matches;
    // stops: each case's start, plus its end when the case is taller than the screen (so its lower part is shown too)
    let firstH=0,lastH=0,cameFromBelow=false;
    const measure=()=>{let y=list.getBoundingClientRect().top+scrollY;const out=[];firstH=list.firstElementChild?.offsetHeight||0;lastH=list.lastElementChild?.offsetHeight||0;[...list.children].forEach(c=>{const h=c.offsetHeight;out.push(Math.round(y));if(h>innerHeight+20)out.push(Math.round(y+h-innerHeight));y+=h;});starts=out;};
    // ease-out: the page starts moving at once, which reads as an instant response
    const ease=t=>1-Math.pow(1-t,3);
    const unlockLater=()=>{clearTimeout(lockTimer);lockTimer=setTimeout(()=>{locked=false;},100);};
    const go=target=>{
      cancelAnimationFrame(anim);const from=scrollY,dist=target-from,t0=performance.now(),dur=520;animEnd=t0+dur;animTarget=target;locked=true;lockSince=t0;lockDir=Math.sign(dist);
      const step=now=>{const t=Math.min(1,(now-t0)/dur);scrollTo(0,from+dist*ease(t));if(t<1)anim=requestAnimationFrame(step);else{anim=0;unlockLater();}};
      anim=requestAnimationFrame(step);
    };
    // an animation whose frames never came (tab in the background) must not keep the page locked
    const settle=()=>{if(anim&&performance.now()>animEnd+300){cancelAnimationFrame(anim);anim=0;scrollTo(0,animTarget);unlockLater();}};
    const target=dir=>{
      const y=scrollY,first=starts[0],last=starts[starts.length-1];
      // coming from above, the first case is caught once the bottom of the screen reaches 80% of its height
      if(dir>0){if(y+innerHeight<first+firstH*.8||y>=last-2)return null;return starts.find(v=>v>y+2)??null;}
      // coming from below, the last case is caught first (once 80% of it is on screen) and the page stops on it whole;
      // only the next gesture moves on to the previous case
      if(y>last+2)return y<=last+lastH*.2?last:null;
      if(cameFromBelow&&y<last-2)return last;   // a fast flick skipped past the catch line: still stop on the last case
      if(y<=first+2)return null;
      for(let i=starts.length-1;i>=0;i--)if(starts[i]<y-2)return starts[i];return null;
    };
    const onWheel=e=>{
      if(!enabled()||!starts.length||e.ctrlKey||Math.abs(e.deltaY)<=Math.abs(e.deltaX))return;
      settle();
      // After a case change the rest of that gesture's momentum is swallowed, but a fresh gesture is answered at once.
      // Momentum arrives as a dense stream of shrinking deltas in the same direction; a fresh gesture shows as a pause
      // in the stream, a jump in size, or a change of direction.
      const now=performance.now(),abs=Math.abs(e.deltaY),dir=Math.sign(e.deltaY);
      const fresh=abs>lastAbs*1.6+4||now-lastAt>60||dir!==lockDir;lastAbs=abs;lastAt=now;
      if(locked&&(anim||!fresh)&&now-lockSince<1200){e.preventDefault();if(!anim)unlockLater();return;}
      locked=false;clearTimeout(lockTimer);
      const last=starts[starts.length-1],to=target(Math.sign(e.deltaY));
      cameFromBelow=e.deltaY<0&&(scrollY>last+2||cameFromBelow&&to==null);
      if(to==null)return;
      cameFromBelow=false;e.preventDefault();go(to);
    };
    // Keyboard: ↓ / PageDown / Space go to the next case, ↑ / PageUp / Shift+Space to the previous one
    const onKey=e=>{
      if(!enabled()||!starts.length||e.altKey||e.ctrlKey||e.metaKey||e.defaultPrevented)return;
      const el=document.activeElement;if(el&&(el.closest('input,textarea,select,[contenteditable=true],dialog')||(e.key===' '&&el.closest('button,a,summary'))))return;
      const dir={ArrowDown:1,PageDown:1,ArrowUp:-1,PageUp:-1}[e.key]??(e.key===' '?(e.shiftKey?-1:1):0);if(!dir)return;
      settle();
      if(anim){e.preventDefault();return;}
      const to=target(dir);if(to==null)return;
      e.preventDefault();go(to);
    };
    measure();const ro=new ResizeObserver(measure);ro.observe(list);addEventListener('resize',measure);zone.addEventListener('wheel',onWheel,{passive:false});addEventListener('keydown',onKey);
    return()=>{ro.disconnect();removeEventListener('resize',measure);zone.removeEventListener('wheel',onWheel);removeEventListener('keydown',onKey);cancelAnimationFrame(anim);clearTimeout(lockTimer);};
  },[casesV]);
  // Case pills: the case that holds the upper part of the screen is the current one
  const [activeCase,setActiveCase]=useState(0);
  useEffect(()=>{
    const list=document.querySelector('.case-list');if(!list)return;
    let starts=[];
    const measure=()=>{const items=[...list.children];let y=list.getBoundingClientRect().top+scrollY;starts=items.map(c=>{const at=y;y+=c.offsetHeight;return at;});};
    // scroll work is a comparison against cached numbers only; React skips the render when the case is unchanged
    const onScroll=()=>{const probe=scrollY+innerHeight*.4;let k=0;starts.forEach((t,i)=>{if(t<=probe)k=i;});setActiveCase(k);};
    const remeasure=()=>{measure();onScroll();};
    remeasure();const ro=new ResizeObserver(remeasure);ro.observe(list);addEventListener('resize',remeasure);addEventListener('scroll',onScroll,{passive:true});
    return()=>{ro.disconnect();removeEventListener('resize',remeasure);removeEventListener('scroll',onScroll);};
  },[]);
  const notify=s=>{clearTimeout(noticeTimer.current);setNotice(s);noticeTimer.current=setTimeout(()=>setNotice(''),4200);};
  useEffect(()=>{
    const mq=matchMedia('(prefers-reduced-motion: reduce)');const pref=e=>setReduced(e.matches);mq.addEventListener('change',pref);
    const stopReveal=setupReveal();
    return()=>{mq.removeEventListener('change',pref);stopReveal();clearTimeout(noticeTimer.current);};
  },[]);
  const chooseService=i=>{setSelected([selection[[0,1,1,2][i]]]);scrollToRequest();};
  return <MotionContext.Provider value={reduced}><ScenesContext.Provider value={scenesMode}><FramesContext.Provider value={imageFrames}><div className={`site${reduced?' reduce-motion':''}${scenesMode==='images'?' scenes-static':''}`}><ImageTweaks/>
    <a className="skip-link" href="#main">Перейти к содержимому</a>
    {!page&&<SectionNav/>}
    {!page&&<StickyCta onOpen={()=>setModal('hero')} hidden={!!modal}/>}
    <header className="header wrap">
      <a href={home} className="wordmark" aria-label="КАСТОМС ЛИДЕР — в начало"><img className="header-logo logo-on-dark" src={logoOnDark} alt="КАСТОМС ЛИДЕР" width="960" height="113"/><img className="header-logo logo-on-light" src={logoOnLight} alt="КАСТОМС ЛИДЕР" width="960" height="112"/></a>

      <p className="header-description">Международная и внутренняя логистика промышленного горнодобывающего оборудования и негабарита.</p>
      <SiteMenu current={page?.path} theme={theme} setTheme={setTheme}/>

      <button className="russia-link text-link" onClick={()=>setModal('russia')}><span className="russia-text"><span>Нужна перевозка</span> <span>по России?</span></span> <ArrowUpRight size={15}/></button>
      <div className="header-contacts"><a href="tel:+79038792020">+7 (903) 879-20-20</a><a href="mailto:info@customsleader.ru">info@customsleader.ru</a></div>
      <button className="header-callback" onClick={()=>setModal('callback')}>Заказать звонок <ArrowUpRight size={16}/></button>
      {THEME_SWITCHER&&<button type="button" className="theme-flip" onClick={()=>setTheme(t=>t==="graphite"?"steel":"graphite")} aria-label={theme==="graphite"?"Включить светлую тему":"Включить тёмную тему"} title={theme==="graphite"?"Светлая тема":"Тёмная тема"}>{theme==="graphite"?<Sun size={20}/>:<Moon size={20}/>}</button>}
    </header>
    <SiteNav current={page?.path}/>
    <main id="main">
      {page?.kind==='notfound'?<NotFound page={page}/>:page?<SubPage page={page} office={here} setModal={setModal} setLegal={setLegal}/>:<>
      <section className="hero wrap">
        <div className="hero-layout"><div className="hero-backdrop"><img src={miningComplex} alt="Горнопроходческий комплекс NORDA в цехе завода перед отгрузкой" width="1280" height="851" fetchPriority="high"/><CaseLink className="hp-case-photo"/></div><div className="hero-story"><h1>Доставим станки, линии и негабарит из Китая «в белую», даже на <span>Крайний Север</span></h1><p className="hero-lead"><Text value={S[1].LEAD}/></p><Button className="mobile-hero-action cta-quote" onClick={()=>setModal('hero')}>{shortCTA}</Button><HeroProof/></div><div className="hero-form" id="hero-request"><Form id="hero" onLegal={setLegal}/></div></div>
      </section>

      <section className="section tasks light" data-reveal><div className="wrap"><h2><Text value={sourceTitle(2)}/></h2><div className="task-grid">{S[2].tables.map(([title,text],i)=>{const Icon=[Settings2,PackageCheck,Truck,Route][i];return <article key={title}><div className={`task-diagram diagram-${i}`} aria-hidden="true"><Icon size={64} strokeWidth={.9}/><span className="diagram-cross a"/><span className="diagram-cross b"/></div><h3><Text value={title}/></h3><p><Text value={text}/></p></article>})}</div></div></section>

      <section className="section services" id="services" data-reveal><div className="wrap"><div className="section-heading"><h2><Text value={sourceTitle(3)}/></h2>
          <div className="exclusions"><span>Не работаем:</span><ul><li><X size={16} strokeWidth={2.2} aria-hidden="true"/>с продуктами питания</li><li><X size={16} strokeWidth={2.2} aria-hidden="true"/>с военными грузами</li><li><X size={16} strokeWidth={2.2} aria-hidden="true"/>с табаком и алкоголем</li><li><X size={16} strokeWidth={2.2} aria-hidden="true"/>с физическими лицами</li></ul></div>
        </div>

        <div className="services-grid">{services.map((s,i)=>{const Icon=[Layers3,Globe2,Truck,FileCheck2][i];return <article key={s.title}><Icon size={30} strokeWidth={1.3}/><h3>{s.title}</h3><p><Text value={s.text}/></p><Bullets items={s.list}/><button className="service-cta" onClick={()=>chooseService(i)}>{s.cta}<ArrowUpRight size={21}/></button></article>})}</div>

        </div></section>

      <section className="section cases" id="cases"><div className="wrap"><h2 data-reveal><Text value={sourceTitle(4)}/></h2>

        <nav className="cases-nav" aria-label="Кейсы">{cases.map((c,i)=><button type="button" key={c.title} aria-current={activeCase===i?'true':undefined} onClick={()=>goToCase(i)}>Кейс {i+1}</button>)}</nav>
        <div className="case-list" data-v={casesV}>{cases.map((c,i)=><article className={`case case-${i}`} id={c.source?'case-norda':undefined} key={c.title} data-reveal><span className="case-dim" aria-hidden="true"/><div className="case-main"><div className="case-copy"><h3><CaseTitle title={c.title}/></h3><div className={`case-stat ${/^\d/.test(c.stat)?'':'stat-words'}`}><strong>{c.stat}</strong>{c.label&&<span><Text value={c.label}/></span>}</div><p>{c.description}</p></div><div className="case-visual has-photo"><CasePhoto i={i}><span className="client-label">Кейс {i+1}</span>{CASE_PHOTOS[i].caption&&<span className="photo-caption" aria-hidden="true">{CASE_PHOTOS[i].caption}</span>}</CasePhoto></div></div><div className="case-details">{c.headings.map((h,k)=>{const cut=h.indexOf(':')+1;return <div key={h}><h4>{cut>0?<><span className={`case-step${h.startsWith('Сложность')?' is-risk':''}`}>{h.slice(0,cut)}</span> {(t=>t.charAt(0).toUpperCase()+t.slice(1))(h.slice(cut).trim())}</>:h}</h4><p>{c.paragraphs[k]}</p></div>})}</div></article>)}</div>

      </div></section>

      <section className="section request light" id="request" data-reveal><div className="wrap"><div className="section-heading"><div><h2><Text value={sourceTitle(5)}/></h2><p className="lead"><Text value={S[5].LEAD}/></p></div><Bullets items={['После заявки менеджер свяжется с вами в течение 1 часа','Сформируем 1–3 маршрута: по сроку, стоимости, надёжности','Сравним: авиа, авто, ЖД, море. Объясним нюансы (наличие СВХ, разницу кодов ТН ВЭД, сезонность)']}/></div><Form id="detailed" variant="detailed" chosen={selected} setChosen={setSelected} onLegal={setLegal}/></div></section>

      <Journey onRequest={scrollToRequest}/>

      <section className="section team light" data-reveal><div className="wrap"><div className="team-heading"><h2><Text value={sourceTitle(7)}/></h2><p className="lead"><Text value={S[7].LEAD}/></p></div><div className="team-roles">{S[7].tables.map(([name,text],i)=>{const Icon=[UserRound,FileCheck2,Route,Layers3][i];return <article key={name}><Icon size={28} strokeWidth={1.2}/><h3>{name}</h3><p>{sentences(text)}</p></article>})}</div></div></section>

      <section className="section insurance" data-reveal><div className="wrap insurance-layout"><div><h2><Text value={sourceTitle(8)}/></h2><Bullets items={['Понимаете, на какую сумму защищён груз. Проверим страховую сумму и лимиты применительно к вашей поставке. В случае непокрытия ответственности, застрахуем дополнительно.','Знаете об ограничениях до отправки. Покажем, какие риски покрываются, а какие расходы могут остаться на вашей стороне.','Получаете подтверждение защиты документами. До договора предоставим действующий полис и подтверждение оплаты']}/></div><InsuranceDoc/></div></section>

      <section className="section founder light" data-reveal><div className="wrap"><h2><Text value={sourceTitle(9)}/></h2><div className="founder-layout"><div className="founder-media"><FramedPicture id="founder" photo={FOUNDER_PHOTO} className="founder-photo"/></div>

        <div className="founder-copy"><h3>Хасанов <br/>Эдуард Ряфхатович</h3>
          <p className="founder-path">Основатель и <mark>руководитель компании</mark></p>
          <p><Text value={entries(9,'P')[0]}/></p><ul className="founder-facts"><li><strong>13 лет</strong><span>в таможенных органах</span></li><li><strong>9 лет</strong><span>развивал таможенное и логистическое направление других компаний</span></li><li><strong>8 лет</strong><span>строит собственную компанию</span></li><li><FileCheck2 size={29}/><span>Юридическое образование</span></li></ul></div>

      </div></div></section>

      <section className="section faq light" data-reveal><div className="wrap faq-layout"><h2><Text value={sourceTitle(10)}/></h2><div className="faq-list">{faq.map((f,i)=><details key={f.question}><summary><h3>{f.question}</h3><Plus className="faq-plus" size={21}/></summary><p>{f.answer}</p></details>)}</div></div></section>

      <section className="section final-request" data-reveal><div className="wrap"><div className="final-layout"><div><h2><Text value={sourceTitle(11)}/></h2><Bullets items={['После заявки менеджер свяжется с вами в течение 1 часа','Запросим базовые данные: откуда, что везём, вес/объём, требования','Сформируем 1–3 маршрута: по сроку, стоимости, надёжности','Сравним: авиа, авто, ЖД, море. Объясним нюансы (наличие СВХ, разницу кодов ТН ВЭД, сезонность)']}/></div><Form id="final" onLegal={setLegal}/></div></div></section>

      <section className="section clients-section" id="clients" data-reveal><div className="wrap"><ClientLogos/></div></section>

      </>}

      <section className="section contact" id="contacts" data-reveal><div className="wrap contact-layout"><h2><Text value={sourceTitle(12)}/></h2><div className="contact-actions"><div className="messengers"><button className="messenger-max" onClick={()=>{const find='найдите нас в MAX по номеру +7 (903) 879-20-20';Promise.resolve(navigator.clipboard?.writeText('+79038792020')).then(()=>navigator.clipboard?notify(`Номер скопирован: ${find}.`):Promise.reject()).catch(()=>notify(`Чтобы написать, ${find}.`));}}><span className="messenger-main"><MessageSquare/>Написать в MAX</span><span className="messenger-go" aria-hidden="true"><ArrowUpRight size={18}/></span></button><a className="messenger-whatsapp" href="https://wa.me/79038792020" target="_blank" rel="noopener"><span className="messenger-main"><MessageCircle/>Написать в WhatsApp</span><span className="messenger-go" aria-hidden="true"><ArrowUpRight size={18}/></span></a><a className="messenger-telegram" href="https://t.me/+79038792020" target="_blank" rel="noopener"><span className="messenger-main"><Send/>Написать в Telegram</span><span className="messenger-go" aria-hidden="true"><ArrowUpRight size={18}/></span></a></div><p>Или позвоните по номеру:</p><a className="contact-phone" href="tel:+79038792020">+7 (903) 879-20-20</a><a className="contact-email" href="mailto:info@customsleader.ru">info@customsleader.ru</a></div></div></section>
    </main>
    <SiteFooter showNote={showNote} home={home} here={here} setModal={setModal} setLegal={setLegal} setCookieOpen={setCookieOpen}/>
    {!cookieOpen&&<ScrollTopButton/>}{cookieOpen&&<CookieNotice startInSettings={cookieOpen==='settings'} onClose={()=>setCookieOpen(false)} onPolicy={()=>setLegal('cookies')} onConsent={()=>setLegal('analytics')}/>}
    {notice&&<div className="toast" role="status">{notice}<button aria-label="Закрыть уведомление" onClick={()=>setNotice('')}><X size={17}/></button></div>}
    {modal&&<Modal type={modal} onClose={()=>setModal(null)} onLegal={setLegal}/>}{legal&&<Modal type={legal} onClose={()=>setLegal(null)}/>} 
  </div></FramesContext.Provider></ScenesContext.Provider></MotionContext.Provider>;
}
