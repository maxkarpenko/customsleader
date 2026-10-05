import React, {useEffect, useId, useRef, useState, createContext, useContext} from 'react';
import {ArrowUpRight, ArrowRight, ArrowDown, ArrowLeft, Check, Plus, Minus, X, Phone, ShieldCheck, PackageCheck, Route, Truck, FileCheck2, Globe2, Pause, Play, MessageCircle, MessageSquare, Mail, UserRound, CircleCheck, Info, LoaderCircle, Send, Layers3, Settings2, SlidersHorizontal, RotateCcw, Copy} from 'lucide-react';
import content from './content.json';
import {SCENES_MODE,SCENES_KEY,TWEAKS_CASES_KEY,TWEAKS_STILLS_KEY,TWEAKS_FOUNDER_KEY,COOKIE_CONSENT_KEY,COOKIE_CONSENT_VERSION,YANDEX_METRIKA_ID,GOOGLE_ANALYTICS_ID} from './siteConfig.js';
import privacyPolicy from './legal/privacy-policy.md?raw';
import personalDataPolicy from './legal/personal-data-policy.md?raw';
import consentText from './legal/consent.md?raw';
import cookiePolicy from './legal/cookie-policy.md?raw';
import bottlingLine from './assets/media/bottling-line.webp';
import hvacTruck from './assets/media/hvac-truck.webp';
import miningComplex from './assets/media/mining-complex.webp';
import routeConvoy from './assets/media/route-convoy.webp';
import routeRain from './assets/media/route-rain.webp';
import logoOnDark from './assets/media/logo-on-dark.webp';
import founderPhoto from './assets/media/founder.webp';

const {sections:S,services,cases,tabs,faq}=content;
const MotionContext=createContext(false);
const clean=s=>s?.replaceAll('<br>',' ')||'';
const Text=({value})=><>{clean(value)}</>;
const entries=(n,tag)=>S[n].entries.filter(e=>e.tag===tag).map(e=>e.text);
const sourceTitle=n=>S[n].H2;
const shortCTA='Получить стоимость и сроки';
const selection=['Перевозка и таможня','Только перевозка','Таможенное оформление','Нужна консультация'];
const scrollToRequest=()=>(document.querySelector('#request .form-detailed')||document.getElementById('request'))?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});

// Illustrations: WebGL scenes or still photos, chosen once per page load (see src/siteConfig.js).
const ScenesContext=createContext(SCENES_MODE);
const scenesMode=(()=>{try{const v=localStorage.getItem(SCENES_KEY);if(v==='3d'||v==='images')return v;}catch{}return SCENES_MODE;})();
const STILLS={
  hero:{src:routeConvoy,w:1600,h:1073,alt:'Колонна грузовиков с оборудованием на горной дороге'},
  container:{src:routeRain,w:1600,h:1073,alt:'Тягач с промышленной линией на открытом полуприцепе'},
  winter:{src:routeConvoy,w:1600,h:1073,alt:'Колонна грузовиков с оборудованием на горной дороге'},
  hvac:{src:hvacTruck,w:1600,h:893,alt:'Тягач с климатическим оборудованием в упаковочной плёнке'},
  turbine:{src:miningComplex,w:1280,h:851,alt:'Горнопроходческий комплекс в цехе завода'},
  end:{src:bottlingLine,w:1600,h:1073,alt:'Тягач с оборудованием на трассе через тайгу'},
};
function Picture({src,w,h,alt,eager=false}){
  return <picture><img src={src} alt={alt} width={w} height={h} loading={eager?'eager':'lazy'} decoding="async"/></picture>;
}
function Scene(props){
  const mode=useContext(ScenesContext);
  if(mode!=='images')return <Scene3D {...props}/>;
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
  {src:bottlingLine,w:1600,h:1073,alt:'Тягач с линией розлива воды в открытом контейнере на трассе через тайгу'},
  {src:miningComplex,w:1280,h:851,alt:'Горнопроходческий комплекс в цехе завода перед отгрузкой'},
  {src:hvacTruck,w:1600,h:893,alt:'Тягач с климатическим оборудованием в упаковочной плёнке на трассе'},
];
const FRAME={width:100,height:375,ratio:'3/2',fit:'cover',zoom:1,posX:50,posY:50,offsetX:0,offsetY:0};
const IMAGE_FRAMES={case0:{...FRAME},case1:{...FRAME},case2:{...FRAME},hero:{...FRAME,ratio:'auto',height:360},end:{...FRAME,ratio:'auto',height:420},founder:{...FRAME,ratio:'4/5',posY:25}};
const FRAME_LABELS={case0:'Кейс 1',case1:'Кейс 2',case2:'Кейс 3',hero:'Первый экран',end:'Финальный блок',founder:'Фото основателя'};
const FRAMES_KEY='image-frames';
const tweakOn=key=>{try{return localStorage.getItem(key)!=='0';}catch{return true;}};
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
const FOUNDER_PHOTO={src:founderPhoto,w:910,h:1280,alt:'Эдуард Хасанов, основатель КАСТОМС ЛИДЕР'};
function CasePhoto({i,children}){return <FramedPicture id={`case${i}`} photo={CASE_PHOTOS[i]} className="case-photo">{children}</FramedPicture>;}
function ImageTweaks(){
  const targets=[...(TWEAK_GROUPS.cases?['case0','case1','case2']:[]),...(TWEAK_GROUPS.stills?['hero','end']:[]),...(TWEAK_GROUPS.founder?['founder']:[])];
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
function Bullets({items,className=''}){return <ul className={`bullets ${className}`}>{items.map((s,i)=><li key={i}><Check size={17}/><span><Text value={s}/></span></li>)}</ul>}
function Field({label,name,placeholder,type='text',required=false,textarea=false,hint}){
  const id=useId();return <div className="field"><label htmlFor={id}>{label}{required?'*':''}</label>{textarea?<textarea id={id} name={name} placeholder={placeholder} rows={3}/>:<input id={id} name={name} type={type} required={required} placeholder={placeholder} autoComplete={name==='phone'?'tel':name==='name'?'name':name==='email'?'email':name==='company'?'organization':'off'} minLength={type==='tel'?7:undefined} pattern={type==='tel'?'[+0-9 \\(\\)\\-]{7,25}':undefined} inputMode={type==='tel'?'tel':undefined} title={type==='tel'?'Номер телефона: цифры, пробелы, +, скобки и дефис':undefined}/>} {hint&&<small>{hint}</small>}</div>
}

function Form({variant='short',id,chosen,setChosen,onLegal}){
  const [status,setStatus]=useState('idle'),[error,setError]=useState(''),[serviceError,setServiceError]=useState(false);const services=useRef(null);const serviceErrorId=useId();
  const consentId=useId();const detailed=variant==='detailed',callback=variant==='callback',russia=variant==='russia';
  async function submit(e){
    e.preventDefault();setError('');
    const payload=Object.fromEntries(new FormData(e.currentTarget));payload.form=id||variant;if(detailed)payload.services=chosen;
    if(detailed&&!chosen.length){setServiceError(true);services.current?.scrollIntoView({block:'center'});services.current?.querySelector('input')?.focus({preventScroll:true});return;}
    const endpoint=import.meta.env.VITE_LEAD_ENDPOINT;
    if(!endpoint){setStatus('demo');return;}
    setStatus('sending');
    try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw new Error();const data=await r.json();if(data.ok!==true)throw new Error();setStatus('success');window.dispatchEvent(new CustomEvent('lead:success',{detail:{form:payload.form}}));}
    catch{setStatus('idle');setError('Не удалось отправить заявку. Попробуйте ещё раз или позвоните: +7 (903) 879-20-20.');}
  }
  if(status==='success')return <div className="success" role="status"><CircleCheck size={44}/><h3>Спасибо! Заявка отправлена</h3><p>Менеджер свяжется с вами в течение 1 часа</p></div>;
  return <form className={`lead-form form-${variant}`} onSubmit={submit}>
    {!detailed&&!callback&&!russia&&<><p className="form-title">Получите стоимость<br/>и сроки доставки</p><p className="form-intro">В предложении подготовим маршрут, срок, стоимость и состав платежей</p><details className="estimate-hint"><summary>Что входит в расчёт <Info size={14}/></summary><p>Перевозка, таможенное оформление и платежи готовим в одном предложении.<br/>Фиксируем состав работ; возможные дополнительные расходы и условия их возникновения обозначаем отдельно</p></details></>}
    {detailed&&(
      <fieldset ref={services} className="service-choices" aria-describedby={serviceError?serviceErrorId:undefined}><legend>Выберите услугу</legend><div className="choice-grid">{selection.map((name,i)=>{const Icon=[Layers3,Truck,FileCheck2,MessageCircle][i];return <label key={name} className={chosen.includes(name)?'selected':''}><input type="radio" name="services" value={name} checked={chosen.includes(name)} onChange={()=>{setServiceError(false);setChosen([name]);}}/><Icon className="svc-icon" size={26} strokeWidth={1.5} aria-hidden="true"/><span><strong>{name}</strong><small>{['Поставка под ключ','Международная или по РФ','В том числе с вашим перевозчиком','Сложная ситуация или вопрос'][i]}</small></span><span className="svc-check" aria-hidden="true"><Check size={14} strokeWidth={2.6}/></span></label>})}</div>{serviceError&&<p className="form-error service-error" id={serviceErrorId} role="alert">Выберите услугу.</p>}</fieldset>
    )}
    <div className={detailed?'form-columns':''}>
      {detailed&&<fieldset><legend>О грузе и маршруте</legend><div className="field-pair"><Field label="Тип груза / задачи" name="cargo" placeholder="Например: линия розлива"/><Field label="Негабаритный груз?" name="oversized" placeholder="Например: пока не знаю, нужна оценка"/></div><div className="field-pair"><Field label="Направление перевозки" name="direction" placeholder="Например: из Китая"/><Field label="Когда груз нужен на месте" name="deadline" placeholder="Например: к концу ноября"/></div><div className="field-pair"><Field label="Откуда забрать?" name="origin" placeholder="Например: Гонконг"/><Field label="Куда доставить?" name="destination" placeholder="Например: Казань"/></div><Field label="Что нужно сделать?" name="message" textarea placeholder="Опишите своими словами. Например: линия розлива из Гонконга в Казань"/></fieldset>}
      <fieldset><legend className={detailed?'':'sr-only'}>{detailed?'О вас и компании':'Контактные данные'}</legend>
        {!detailed&&!callback&&!russia&&<Field label="Что и куда доставить?" name="message" textarea placeholder="Опишите своими словами. Например: линия розлива из Циндао в Тулу"/>}
        {(detailed||callback||russia)&&<Field label="Ваше имя" name="name" required placeholder="Как к вам обращаться?"/>}
        {detailed&&<><Field label="Компания" name="company" placeholder="Название вашей организации"/><Field label="ИНН компании или ИП" name="inn" placeholder="10 или 12 цифр" hint="Для подготовки предложения на вашу организацию."/><p className="form-note">Оставьте телефон и почту для связи</p></>}
        <div className={detailed?'field-pair':''}><Field label="Укажите телефон" name="phone" type="tel" required placeholder="Например: +7 900 000-00-00"/>{detailed&&<Field label="Укажите почту" name="email" type="email" required placeholder="logist@company.ru"/>}</div>
        {callback&&<Field label="Компания и должность" name="company" placeholder="Например: ООО «Компания», логист"/>}
        {russia&&<><div className="field-pair"><Field label="Откуда забрать?" name="origin" placeholder="Например: Тула"/><Field label="Куда доставить?" name="destination" placeholder="Например: Казань"/></div><Field label="Тип груза / задачи" name="cargo" placeholder="Например: линия розлива"/><Field label="Компания" name="company" placeholder="Название вашей организации"/></>}
        <div className="consent"><input id={consentId} type="checkbox" name="consent" required/><label htmlFor={consentId}>Я даю <button type="button" className="consent-link" onClick={e=>{e.preventDefault();onLegal('consent');}}>согласие на обработку персональных данных</button> и подтверждаю, что ознакомлен с <button type="button" className="consent-link" onClick={e=>{e.preventDefault();onLegal('personal-data');}}>Политикой обработки персональных данных</button></label></div>
        <Button type="submit" disabled={status==='sending'}>{status==='sending'?<><LoaderCircle className="spinner" size={18}/>Отправка…</>:callback?'Заказать звонок':detailed?'Получить стоимость и сроки по моей задаче':shortCTA}</Button>
        {status==='demo'&&<p className="form-feedback" role="status">Форма заполнена. В локальной версии отправка ещё не подключена. Свяжитесь с нами: <a href="tel:+79038792020">+7 (903) 879-20-20</a>.</p>}
        {error&&<p className="form-error" role="alert">{error}</p>}
      </fieldset>
    </div>
  </form>;
}

// Legal documents live as Markdown in src/legal/. The renderer covers what they use:
// "##" headings, paragraphs, "- " lists, **bold**, `code` and [[placeholders]] still to be filled in.
const LEGAL_DOCS={privacy:privacyPolicy,'personal-data':personalDataPolicy,consent:consentText,cookies:cookiePolicy};
const inlineMd=text=>text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[\[[\s\S]+?\]\])/g).map((part,i)=>
  part.startsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>
  :part.startsWith('`')?<code key={i}>{part.slice(1,-1)}</code>
  :part.startsWith('[[')?<mark key={i} className="legal-todo">{part.slice(2,-2)}</mark>
  :part);
function LegalDoc({source}){
  return <div className="legal-doc">{source.trim().split(/\n{2,}/).map((block,i)=>{
    if(block.startsWith('# '))return null;
    if(block.startsWith('## '))return <h3 key={i}>{inlineMd(block.slice(3))}</h3>;
    const lines=block.split('\n');
    if(lines.every(l=>l.startsWith('- ')))return <ul key={i}>{lines.map((l,j)=><li key={j}>{inlineMd(l.slice(2))}</li>)}</ul>;
    return <p key={i}>{inlineMd(lines.join(' '))}</p>;
  })}</div>;
}

function Modal({type,onClose,onLegal}){
  const dialog=useRef(null);
  useEffect(()=>{dialog.current?.showModal();const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old;};},[]);
  const titles={callback:'Заказать звонок',russia:'Нужна перевозка по России?',consent:'Согласие на обработку персональных данных',privacy:'Политика конфиденциальности','personal-data':'Политика в отношении обработки персональных данных',cookies:'Политика использования cookie',offer:'Публичная оферта'};
  const doc=LEGAL_DOCS[type];
  return <dialog ref={dialog} className={`modal${doc?' modal-doc':''}`} onCancel={onClose} aria-labelledby={`modal-title-${type}`} onClick={e=>{if(e.target===dialog.current)onClose();}}><div className="modal-inner"><button className="close-button" onClick={onClose} aria-label="Закрыть окно"><X/></button><h2 id={`modal-title-${type}`}>{titles[type]}</h2>{['callback','russia'].includes(type)?<Form variant={type} onLegal={onLegal}/>:doc?<LegalDoc source={doc}/>:<><p>Документ будет добавлен перед запуском сайта.</p><p>В этой локальной версии данные форм не отправляются.</p><a href="mailto:info@customsleader.ru">info@customsleader.ru</a></>}</div></dialog>;
}

function Journey({onRequest}){
  const [active,setActive]=useState(0);const item=tabs[active];const stops=useRef(null);
  // Fill the route line up to the active stop's dot, measured so it lands on the dot at any width.
  useEffect(()=>{
    const el=stops.current;if(!el)return;
    const place=()=>{const dot=el.querySelectorAll('i')[active];if(!dot||!el.clientWidth)return;const d=dot.getBoundingClientRect(),r=el.getBoundingClientRect();el.style.setProperty('--route-fill',((d.left+d.width/2-r.left)/r.width).toFixed(4));};
    place();const ro=new ResizeObserver(place);ro.observe(el);return()=>ro.disconnect();
  },[active]);
  return <section className="section journey" data-reveal><div className="wrap"><h2>{clean(sourceTitle(6))}</h2><div className="tabs" role="tablist" aria-label="Этапы поставки" style={{'--active':active}}><span className="tab-indicator" aria-hidden="true"/>{tabs.map((tab,i)=><button key={tab.label} role="tab" id={`tab-${i}`} aria-controls={`panel-${i}`} aria-selected={active===i} tabIndex={active===i?0:-1} onClick={()=>setActive(i)} onKeyDown={e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%4;else if(e.key==='ArrowLeft')n=(i+3)%4;else if(e.key==='Home')n=0;else if(e.key==='End')n=3;else return;e.preventDefault();setActive(n);document.getElementById(`tab-${n}`).focus();}}><span className="tab-dot"/>{tab.label}<ArrowRight size={18}/></button>)}</div><div className="journey-panel" id={`panel-${active}`} role="tabpanel" aria-labelledby={`tab-${active}`} tabIndex={0}><div key={active} className="journey-copy"><h3>{item.title}</h3><p>{item.text}</p><Bullets items={item.list}/><p className="note"><Info size={19}/>{item.note}</p><Button onClick={onRequest}>{shortCTA}</Button></div><div className="journey-visual"><Scene key={active} kind={['container','winter','hvac','turbine'][active]}/><div className="route-stops" ref={stops}><span className="route-fill" aria-hidden="true"/>{tabs.map((t,i)=><span key={i} className={i<=active?'passed':''}><i/>{t.label}</span>)}</div></div></div></div></section>;
}

// Cookie consent: a versioned record in localStorage. Without analytics IDs the notice only informs
// (the site sets no cookies); with YANDEX_METRIKA_ID / GOOGLE_ANALYTICS_ID it asks, and the counters
// load only after "Принять все". The footer link "Настройки cookie" reopens it.
const readCookieConsent=()=>{try{const c=JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY)||'null');return c&&c.v===COOKIE_CONSENT_VERSION?c:null;}catch{return null;}};
function loadMetrika(id){
  if(!id||window.ym)return;
  window.ym=function(){(window.ym.a=window.ym.a||[]).push(arguments);};window.ym.l=Date.now();
  const script=document.createElement('script');script.async=true;script.src='https://mc.yandex.ru/metrika/tag.js';document.head.appendChild(script);
  window.ym(id,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true});
}
function loadGoogleAnalytics(id){
  if(!id||window.gtag)return;
  window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments);};
  const script=document.createElement('script');script.async=true;script.src=`https://www.googletagmanager.com/gtag/js?id=${id}`;document.head.appendChild(script);
  window.gtag('js',new Date());window.gtag('config',id);
}
const ANALYTICS_ON=Boolean(YANDEX_METRIKA_ID||GOOGLE_ANALYTICS_ID);
function loadAnalytics(){loadMetrika(YANDEX_METRIKA_ID);loadGoogleAnalytics(GOOGLE_ANALYTICS_ID);}
function clearAnalyticsCookies(){document.cookie.split(';').map(c=>c.split('=')[0].trim()).filter(n=>n.startsWith('_ym')||n.startsWith('_ga')).forEach(n=>{document.cookie=`${n}=; Max-Age=0; path=/`;document.cookie=`${n}=; Max-Age=0; path=/; domain=.${location.hostname}`;});}
function CookieNotice({onClose,onPolicy}){
  const analytics=ANALYTICS_ON;
  function choose(allowAnalytics){
    const before=readCookieConsent();
    try{localStorage.setItem(COOKIE_CONSENT_KEY,JSON.stringify({v:COOKIE_CONSENT_VERSION,analytics:allowAnalytics,at:new Date().toISOString()}));}catch{}
    if(allowAnalytics)loadAnalytics();
    else if(before?.analytics){clearAnalyticsCookies();location.reload();return;}
    onClose();
  }
  const policy=<button type="button" className="cookie-policy-link" onClick={onPolicy}>Политике использования cookie</button>;
  return <aside className="cookie-notice" aria-label="Уведомление о cookie">
    {analytics
      ?<p>Мы сохраняем в браузере необходимые настройки и, с вашего согласия, используем аналитические cookie Яндекс Метрики и Google Analytics, чтобы оценивать посещаемость. Данные Google Analytics обрабатываются за рубежом. Подробнее — в {policy}.</p>
      :<p>Сайт не устанавливает cookie: в браузере сохраняются только необходимые настройки. Подробнее — в {policy}.</p>}
    <div className="cookie-actions">
      {analytics&&<button type="button" className="cookie-secondary" onClick={()=>choose(false)}>Только необходимые</button>}
      <button type="button" className="cookie-accept" onClick={()=>choose(analytics)}>{analytics?'Принять все':'Понятно'} <Check size={15}/></button>
    </div>
  </aside>;
}

export default function App(){
  const [modal,setModal]=useState(null),[legal,setLegal]=useState(null),[selected,setSelected]=useState([selection[0]]),[notice,setNotice]=useState('');
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const imageFrames=useImageFrames();
  const [cookieOpen,setCookieOpen]=useState(()=>!readCookieConsent());
  useEffect(()=>{try{localStorage.removeItem('customs-cookie-choice');}catch{}if(readCookieConsent()?.analytics)loadAnalytics();},[]);
  // Full-bleed hero photos extend under the header; keep its height in --header-h.
  useEffect(()=>{const h=document.querySelector('.header');if(!h)return;const set=()=>document.documentElement.style.setProperty('--header-h',`${h.offsetHeight}px`);set();const ro=new ResizeObserver(set);ro.observe(h);return()=>ro.disconnect();},[]);
  const progressBar=useRef(null);const noticeTimer=useRef(null);
  const notify=s=>{clearTimeout(noticeTimer.current);setNotice(s);noticeTimer.current=setTimeout(()=>setNotice(''),4200);};
  useEffect(()=>{
    const mq=matchMedia('(prefers-reduced-motion: reduce)');const pref=e=>setReduced(e.matches);mq.addEventListener('change',pref);
    let frame;const onScroll=()=>{if(frame)return;frame=requestAnimationFrame(()=>{const max=document.documentElement.scrollHeight-innerHeight;if(progressBar.current)progressBar.current.style.transform=`scaleX(${max>0?window.scrollY/max:0})`;frame=null;});};
    addEventListener('scroll',onScroll,{passive:true});onScroll();
    const observer=new IntersectionObserver(items=>items.forEach(i=>{if(i.isIntersecting){i.target.classList.add('revealed');observer.unobserve(i.target);}}),{threshold:.05});document.querySelectorAll('[data-reveal]').forEach(el=>observer.observe(el));
    return()=>{mq.removeEventListener('change',pref);removeEventListener('scroll',onScroll);cancelAnimationFrame(frame);observer.disconnect();clearTimeout(noticeTimer.current);};
  },[]);
  const chooseService=i=>{setSelected([selection[[0,1,1,2][i]]]);scrollToRequest();};
  return <MotionContext.Provider value={reduced}><ScenesContext.Provider value={scenesMode}><FramesContext.Provider value={imageFrames}><div className={`site${reduced?' reduce-motion':''}${scenesMode==='images'?' scenes-static':''}`}><ImageTweaks/>
    <a className="skip-link" href="#main">Перейти к содержимому</a>
    <div className="reading-progress" aria-hidden="true" ref={progressBar}/>
    <header className="header wrap">
      <a href="#" className="wordmark" aria-label="КАСТОМС ЛИДЕР — в начало"><img className="header-logo" src={logoOnDark} alt="КАСТОМС ЛИДЕР" width="960" height="113"/></a>

      <p className="header-description">Международная и внутренняя логистика. Промышленного оборудования и негабарита. Горнодобывающее, горнопромышленное и вспомогательное оборудование к ним.</p>

      <button className="russia-link text-link" onClick={()=>setModal('russia')}>Нужна перевозка по России? <ArrowUpRight size={15}/></button>
      <div className="header-contacts"><a href="tel:+79038792020">+7 (903) 879-20-20</a><a href="mailto:info@customsleader.ru">info@customsleader.ru</a></div>
      <button className="header-callback" onClick={()=>setModal('callback')}>Заказать звонок <ArrowUpRight size={16}/></button>
    </header>
    <main id="main">
      <section className="hero wrap">
        <div className="hero-layout"><div className="hero-backdrop" aria-hidden="true"><img src={miningComplex} alt="" width="1280" height="851"/></div><div className="hero-story"><h1>Доставим станки, линии и негабарит из Китая «в белую», даже на <span>Крайний Север</span></h1><p className="hero-lead"><Text value={S[1].LEAD}/></p><Button className="mobile-hero-action" onClick={()=>document.getElementById('hero-request').scrollIntoView({behavior:'instant',block:'start'})}>{shortCTA}</Button></div><div className="hero-form" id="hero-request"><Form id="hero" onLegal={setLegal}/></div></div>
        <div className="hero-benefits"><div><ShieldCheck/><h2><b>Более 20 лет</b> работы с ВЭД</h2><p>Проверяем документы и требования к оформлению до отправки груза</p></div><div><PackageCheck/><h2>Сами работаем <br/>с поставщиком</h2><p>Документы, упаковку и подготовку груза к вывозу берём на себя</p></div><div><Route/><h2>Бюджет всей поставки <br/>известен заранее</h2><p>Делаем расчёт за перевозку, таможенное оформление и платежи в одном предложении</p></div></div>
        <div className="project-strip"><div className="project-weight"><strong>1'200 т</strong><span>масса доставленного<br/>комплекса</span></div><div className="project-route"><span className="project-label">ВЫПОЛНЕННЫЙ ПРОЕКТ</span><h2>Китай → рудник Таймырский</h2></div><p>Доставили в разобранном виде,<br/>включая участок по зимнику</p><ArrowDown size={24}/></div>
      </section>

      <section className="section tasks light" data-reveal><div className="wrap"><h2><Text value={sourceTitle(2)}/></h2><div className="task-grid">{S[2].tables.map(([title,text],i)=>{const Icon=[Settings2,PackageCheck,Truck,Route][i];return <article key={title}><div className={`task-diagram diagram-${i}`} aria-hidden="true"><Icon size={64} strokeWidth={.9}/><span className="diagram-cross a"/><span className="diagram-cross b"/></div><h3><Text value={title}/></h3><p><Text value={text}/></p></article>})}</div></div></section>

      <section className="section services" data-reveal><div className="wrap"><div className="section-heading"><h2><Text value={sourceTitle(3)}/></h2>
          <div className="exclusions"><span>Не работаем:</span><ul><li><X size={16} strokeWidth={2.2} aria-hidden="true"/>с военными грузами</li><li><X size={16} strokeWidth={2.2} aria-hidden="true"/>с продуктами питания</li><li><X size={16} strokeWidth={2.2} aria-hidden="true"/>с табаком и алкоголем</li><li><X size={16} strokeWidth={2.2} aria-hidden="true"/>с физическими лицами</li></ul></div>
        </div>

        <div className="services-grid">{services.map((s,i)=>{const Icon=[Layers3,Globe2,Truck,FileCheck2][i];return <article key={s.title}><Icon size={30} strokeWidth={1.3}/><h3>{s.title}</h3><p><Text value={s.text}/></p><Bullets items={s.list}/><button className="service-cta" onClick={()=>chooseService(i)}>{s.cta}<ArrowUpRight size={21}/></button></article>})}</div>

        </div></section>

      <section className="section cases"><div className="wrap"><h2 data-reveal><Text value={sourceTitle(4)}/></h2>

        <div className="case-list">{cases.map((c,i)=><article className={`case case-${i}`} key={c.title} data-reveal><div className="case-main"><div className="case-copy"><h3><Text value={c.title}/></h3><div className={`case-stat ${i===2?'stat-words':''}`}><strong>{c.stat}</strong>{c.label&&<span><Text value={c.label}/></span>}</div><p>{c.description}</p></div><div className="case-visual has-photo"><CasePhoto i={i}><span className="client-label">Кейс {i+1}</span></CasePhoto></div></div><div className="case-details">{c.headings.map((h,k)=>{const cut=h.indexOf(':')+1;return <div key={h}><h4>{cut>0?<><span className="case-step">{h.slice(0,cut)}</span> {h.slice(cut).trim()}</>:h}</h4><p>{c.paragraphs[k]}</p></div>})}</div></article>)}</div>

      </div></section>

      <section className="section request light" id="request" data-reveal><div className="wrap"><div className="section-heading"><div><h2><Text value={sourceTitle(5)}/></h2><p className="lead"><Text value={S[5].LEAD}/></p></div><Bullets items={['После заявки менеджер свяжется с вами в течение 1 часа','Сформируем 1–3 маршрута: по сроку, стоимости, надёжности','Сравним: авиа, авто, ЖД, объясним нюансы (наличие СВХ, по коду ТН ВЭД, сезонность)']}/></div><Form id="detailed" variant="detailed" chosen={selected} setChosen={setSelected} onLegal={setLegal}/></div></section>

      <Journey onRequest={scrollToRequest}/>

      <section className="section team light" data-reveal><div className="wrap"><div className="team-intro"><div className="team-globe"><Scene kind="globe" label="Иллюстрация международных маршрутов на вращающемся глобусе"/></div><div><h2><Text value={sourceTitle(7)}/></h2><p className="lead"><Text value={S[7].LEAD}/></p><p className="note"><Layers3 size={22}/>Если менеджер сменился или в отпуске, коллега откроет историю сделки и продолжит работу с текущего этапа</p></div></div><div className="team-roles">{S[7].tables.map(([name,text],i)=>{const Icon=[UserRound,FileCheck2,Route,Layers3][i];return <article key={name}><Icon size={28} strokeWidth={1.2}/><h3>{name}</h3><p><Text value={text}/></p></article>})}</div></div></section>

      <section className="section insurance" data-reveal><div className="wrap insurance-layout"><div><h2><Text value={sourceTitle(8)}/></h2><Bullets items={['Понимаете, на какую сумму защищён груз. Проверим страховую сумму и лимиты применительно к вашей поставке. В случае непокрытия ответственности, застрахуем дополнительно.','Знаете об ограничениях до отправки. Покажем, какие риски покрываются, а какие расходы могут остаться на вашей стороне.','Получаете подтверждение защиты документами. До договора предоставим действующий полис и подтверждение оплаты']}/></div><div className="insurance-art" aria-hidden="true"><ShieldCheck size={156} strokeWidth={.7}/><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="orbit orbit-c"/></div></div></section>

      <section className="section founder light" data-reveal><div className="wrap"><h2><Text value={sourceTitle(9)}/></h2><div className="founder-layout"><div className="founder-media"><FramedPicture id="founder" photo={FOUNDER_PHOTO} className="founder-photo"/></div><div className="founder-copy"><h3>Хасанов Эдуард Ряфхатович</h3><p><Text value={entries(9,'P')[0]}/></p><ul className="founder-facts"><li><strong>13 лет</strong><span>в таможенных органах</span></li><li><strong>9 лет</strong><span>развивал таможенное и логистическое направление других компаний</span></li><li><strong>8 лет</strong><span>строит собственную компанию</span></li><li><FileCheck2 size={29}/><span>Юридическое образование</span></li></ul></div></div></div></section>

      <section className="section faq light" data-reveal><div className="wrap faq-layout"><h2><Text value={sourceTitle(10)}/></h2><div className="faq-list">{faq.map((f,i)=><details key={f.question}><summary><h3>{f.question}</h3><Plus className="faq-plus" size={21}/></summary><p>{f.answer}</p></details>)}</div></div></section>

      <section className="section final-request" data-reveal><div className="wrap"><div className="final-layout"><div><h2><Text value={sourceTitle(11)}/></h2><Bullets items={['После заявки менеджер свяжется с вами в течение 1 часа','Запросим базовые данные: откуда, что везём, вес/объём, требования','Сформируем 1–3 маршрута: по сроку, стоимости, надёжности','Сравним: авиа, авто, ЖД, объясним нюансы (наличие СВХ, по коду ТН ВЭД, сезонность)']}/></div><Form id="final" onLegal={setLegal}/></div><div className="closing-stage"><Scene kind="end" label="Пустая платформа трала, готовая к следующей перевозке"/></div></div></section>

      <section className="section contact" data-reveal><div className="wrap contact-layout"><h2><Text value={sourceTitle(12)}/></h2><div className="contact-actions"><div className="messengers"><button onClick={()=>notify('Ссылка на MAX будет добавлена позже.')}><MessageSquare/>Написать в MAX<ArrowUpRight size={18}/></button><button onClick={()=>notify('Ссылка на WhatsApp будет добавлена позже.')}><MessageCircle/>Написать в WhatsApp<ArrowUpRight size={18}/></button><button onClick={()=>notify('Ссылка на Telegram будет добавлена позже.')}><Send/>Написать в Telegram<ArrowUpRight size={18}/></button></div><p>Или позвоните по номеру:</p><a className="contact-phone" href="tel:+79038792020">+7 (903) 879-20-20</a><a className="contact-email" href="mailto:info@customsleader.ru">info@customsleader.ru</a></div></div></section>
    </main>
    <footer className="footer wrap"><div className="footer-top"><a href="#" className="wordmark" aria-label="КАСТОМС ЛИДЕР — в начало"><img src={logoOnDark} alt="КАСТОМС ЛИДЕР" width="960" height="113" loading="lazy"/></a><p>Международная и внутренняя логистика. Промышленного оборудования и негабарита. Горнодобывающее, горнопромышленное и вспомогательное оборудование к ним.</p><p className="footer-address">Адрес: <a href="https://yandex.ru/maps/?text=%D0%98%D0%B2%D0%B0%D0%BD%D0%BE%D0%B2%D0%BE%2C%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%20%D0%A1%D1%82%D0%B5%D0%BF%D0%B0%D0%BD%D0%BE%D0%B2%D0%B0%2C%205" target="_blank" rel="noopener noreferrer">Иваново,<br/>ул. Степанова, 5,<br/>оф. 307А</a></p><div className="footer-contacts"><a href="tel:+79038792020">+7 (903) 879-20-20</a><a href="mailto:info@customsleader.ru">info@customsleader.ru</a><button onClick={()=>setModal('callback')}>Заказать звонок <ArrowUpRight size={16}/></button></div></div><div className="footer-bottom"><p>ООО «КАСТОМС ЛИДЕР» ИНН: 3702195282</p><p>Вся информация, размещённая на сайте, носит ознакомительный характер и может отличаться от действительности</p><div><button onClick={()=>setLegal('privacy')}>Политика конфиденциальности</button><button onClick={()=>setLegal('personal-data')}>Политика обработки персональных данных</button><button onClick={()=>setLegal('offer')}>Публичная оферта</button><button onClick={()=>setCookieOpen(true)}>Настройки cookie</button></div></div></footer>
    <button className="motion-toggle" onClick={()=>setReduced(!reduced)} aria-label={reduced?'Включить анимацию':'Остановить анимацию'} title={reduced?'Включить анимацию':'Остановить анимацию'}>{reduced?<Play size={16}/>:<Pause size={16}/>}</button>
    {cookieOpen&&<CookieNotice onClose={()=>setCookieOpen(false)} onPolicy={()=>setLegal('cookies')}/>}
    {notice&&<div className="toast" role="status">{notice}<button aria-label="Закрыть уведомление" onClick={()=>setNotice('')}><X size={17}/></button></div>}
    {modal&&<Modal type={modal} onClose={()=>setModal(null)} onLegal={setLegal}/>}{legal&&<Modal type={legal} onClose={()=>setLegal(null)}/>} 
  </div></FramesContext.Provider></ScenesContext.Provider></MotionContext.Provider>;
}
