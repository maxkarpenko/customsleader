import {SCENES_MODE,SCENES_KEY} from './siteConfig.js';
import './scenesPage.css';

const labels={'3d':'3D включено','images':'3D выключено, картинки'};
const read=()=>{try{return localStorage.getItem(SCENES_KEY)||'default';}catch{return 'default';}};
const status=document.querySelector('.status');
document.querySelector('[data-default]').textContent=`Сейчас по умолчанию: ${labels[SCENES_MODE]}`;

function render(){
  const mode=read();
  document.querySelectorAll('input[name=mode]').forEach(input=>{input.checked=input.value===mode;});
  const effective=mode==='default'?SCENES_MODE:mode;
  status.textContent=`В этом браузере сайт покажет: ${labels[effective]}.`;
}
document.querySelectorAll('input[name=mode]').forEach(input=>input.addEventListener('change',()=>{
  try{input.value==='default'?localStorage.removeItem(SCENES_KEY):localStorage.setItem(SCENES_KEY,input.value);}
  catch{status.textContent='Браузер не разрешает сохранить настройку (приватный режим или запрет хранилища).';return;}
  render();
}));
render();

// Dev tweak panels: unchecked stores '0', checked removes the key (panels default to on).
document.querySelectorAll('input[data-tweak]').forEach(box=>{
  const key=box.dataset.tweak;
  try{box.checked=localStorage.getItem(key)!=='0';}catch{box.checked=true;}
  box.addEventListener('change',()=>{try{box.checked?localStorage.removeItem(key):localStorage.setItem(key,'0');}catch{}});
});

