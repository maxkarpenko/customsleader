import landUrl from './assets/media/land.geojson?url';
import * as THREE from 'three';

const GREEN = 0x2faf6b;
const clamp = (n, min=0, max=1) => Math.min(max,Math.max(min,n));
const smooth = n => n*n*(3-2*n);
const material = (color, metalness=.2, roughness=.48) => new THREE.MeshStandardMaterial({color,metalness,roughness});
function mesh(parent,geo,mat,x=0,y=0,z=0){
  const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
}
function box(p,mat,w,h,d,x=0,y=0,z=0){return mesh(p,new THREE.BoxGeometry(w,h,d),mat,x,y,z)}
function cyl(p,mat,r,h,x=0,y=0,z=0,segments=40){return mesh(p,new THREE.CylinderGeometry(r,r,h,segments),mat,x,y,z)}
function tube(p,mat,points,r=.028){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),32,r,6,false),mat)}

function truck(){
  const g=new THREE.Group(), accent=material(GREEN,.45,.35), steel=material(0xa6abad,.82,.27),dark=material(0x24292b,.38),rubber=material(0x101315,.05,.85),white=material(0xc7cccc,.5,.3),glass=material(0x1a3037,.65,.16);
  const wheels=[];
  box(g,accent,10,.32,2.55,1,.96);box(g,dark,9.8,.11,2.36,1,1.18);
  for(let x=-3.8;x<6;x+=.25)box(g,steel,.027,.02,2.28,x,1.25);
  for(let side of [-1,1]){
    box(g,accent,10,.25,.16,1,.82,side*1.22);
    for(let x=-3.6;x<6;x+=.8)box(g,white,.32,.085,.02,x,.9,side*1.31);
    for(let x of [-5,-3.85,2.6,3.5,4.4,5.3]){
      const w=new THREE.Group();w.position.set(x,.61,side*1.24);g.add(w);
      const tire=cyl(w,rubber,.57,.35);tire.rotation.x=Math.PI/2;
      const rim=cyl(w,steel,.32,.37);rim.rotation.x=Math.PI/2;
      const hub=cyl(w,dark,.13,.40);hub.rotation.x=Math.PI/2;
      for(let k=0;k<8;k++){const a=k*Math.PI/4;const bolt=cyl(w,white,.034,.42,Math.cos(a)*.22,Math.sin(a)*.22);bolt.rotation.x=Math.PI/2;}
      wheels.push(w);
    }
  }
  box(g,accent,1.25,.24,2.45,-4.5,1.45);box(g,dark,2.7,.32,2.25,-5,1.04);
  const cab=new THREE.Group();g.add(cab);
  box(cab,white,1.9,1.6,2.18,-5.65,2.0);box(cab,white,1.6,.45,2.13,-5.55,2.97);
  box(cab,glass,.035,.77,1.96,-6.62,2.39);box(cab,glass,1.14,.73,.026,-5.78,2.42,1.1);box(cab,glass,1.14,.73,.026,-5.78,2.42,-1.1);
  box(cab,dark,.06,.48,1.28,-6.63,1.52);for(let y=1.33;y<1.75;y+=.09)box(cab,steel,.073,.024,1.27,-6.66,y);
  box(cab,accent,.11,.18,2.12,-6.67,1.15);
  const lamp=new THREE.MeshStandardMaterial({color:0xffffe0,emissive:0xffdcb0,emissiveIntensity:.45});
  for(let z of [-.88,.88]){box(cab,lamp,.08,.17,.3,-6.69,1.53,z);box(cab,dark,.28,.17,.1,-6.12,2.3,z*1.5);box(cab,steel,1.1,.1,.24,-5.7,1.18,z*1.17);}
  for(let x of [-3.7,5.7])for(let z of [-1,1])box(g,accent,.22,.5,.22,x,1.45,z);
  g.userData.wheels=wheels;return g;
}

function load(type){
  const g=new THREE.Group(),silver=material(0xaeb9bd,.72,.32),ivory=material(0xd0d4cd,.38,.42),dark=material(0x344248,.7,.36),accent=material(GREEN,.45,.3);
  if(type==='machine'){
    box(g,dark,3.5,.28,1.8,0,.14);box(g,ivory,3.35,2.45,1.65,0,1.5);
    box(g,dark,1.8,1.6,.06,-.35,1.6, .855);box(g,silver,.1,1.62,.08,.53,1.6,.9);
    box(g,accent,.57,.65,.11,1.12,1.8,.9);box(g,dark,.38,.34,.025,1.12,1.85,.97);
    for(let y=.65;y<2;y+=.19)box(g,dark,.55,.035,.06,1.12,y,-.84);
    for(let x of [-1.4,1.4])box(g,silver,.14,.55,.15,x,2.8);
  } else if(type==='transformer'){
    box(g,dark,3.2,.25,1.9,0,.13);box(g,silver,2.6,2.2,1.6,0,1.4);
    for(let x=-1.3;x<1.4;x+=.13)for(let z of [-1,1])box(g,ivory,.055,1.8,.34,x,1.4,z*.86);
    for(let x of [-.8,0,.8]){cyl(g,dark,.11,1.05,x,2.9);for(let y=2.45;y<3.5;y+=.14)cyl(g,ivory,.23,.06,x,y);}
    box(g,accent,1.1,.1,1.7,0,.37);
  } else if(type==='yacht'){
    const hull=mesh(g,new THREE.SphereGeometry(1,40,16),ivory);hull.scale.set(3.5,.65,1);hull.position.y=.68;
    box(g,ivory,3,.42,1.36,-.3,1.23);box(g,dark,1.8,.66,1.12,-.5,1.64);box(g,ivory,2.2,.12,1.35,-.5,2.03);
    tube(g,silver,[[-2.8,1.3,-.7],[0,1.4,-.9],[2.7,1.23,0],[0,1.4,.9],[-2.8,1.3,.7]],.025);
    cyl(g,silver,.03,.8,-.8,2.42);
  } else if(type==='helicopter'){
    const body=mesh(g,new THREE.SphereGeometry(1,40,24),ivory,0,1.2);body.scale.set(1.7,.87,.82);
    const window=mesh(g,new THREE.SphereGeometry(1,32,16),dark,-.9,1.4);window.scale.set(.85,.59,.78);
    const tail=mesh(g,new THREE.ConeGeometry(.35,3.5,16),ivory,2.5,1.6);tail.rotation.z=-Math.PI/2;
    box(g,accent,.25,.95,.05,3.8,2.0);cyl(g,dark,.09,.6,0,2.2);
    const rotor=box(g,dark,6.4,.055,.17,0,2.52);g.userData.rotor=rotor;
    box(g,dark,.16,.06,5.4,0,2.56);
    for(let z of [-.8,.8]){tube(g,dark,[[-1.4,.16,z],[1,.16,z],[1.3,.35,z]],.05);tube(g,silver,[[-.8,.2,z],[-.5,.9,0],[.7,.9,0],[.9,.2,z]],.04);}
  } else if(type==='container'){
    box(g,accent,5,2.25,2.05,0,1.15);
    for(let x=-2.4;x<2.5;x+=.16)for(let z of [-1.04,1.04])box(g,dark,.035,2.03,.025,x,1.17,z);
    for(let z of [-.8,0,.8])box(g,silver,.035,2.0,.045,-2.53,1.15,z);
  } else if(type==='hvac'){
    box(g,ivory,3.8,2.5,1.8,0,1.35);box(g,dark,3.9,.18,1.95,0,.15);
    for(let x of [-1.05,1.05]){const fan=cyl(g,dark,.64,.08,x,1.45,.95);fan.rotation.x=Math.PI/2;const ring=mesh(g,new THREE.TorusGeometry(.56,.045,8,48),silver,x,1.45,1.02);for(let i=0;i<6;i++){const blade=box(g,silver,.8,.09,.04,x,1.45,1.04);blade.rotation.z=i*Math.PI/3;}}
  } else {
    // Cutter head / turbine: many individual teeth, ribs, rings and service modules.
    box(g,accent,4.6,.25,2.4,0,.14);
    const core=cyl(g,silver,1.05,3.8,0,1.6);core.rotation.z=Math.PI/2;
    for(let x=-1.8;x<1.9;x+=.38){const ring=cyl(g,dark,1.09,.055,x,1.6);ring.rotation.z=Math.PI/2;}
    const head=new THREE.Group();head.position.set(-2,1.6,0);g.add(head);g.userData.head=head;
    const face=cyl(head,silver,1.72,.3);face.rotation.z=Math.PI/2;
    for(let a=0;a<Math.PI*2;a+=Math.PI/12){
      const tooth=box(head,accent,.3,.23,.28,-.23,Math.cos(a)*1.47,Math.sin(a)*1.47);tooth.rotation.x=a;
      const spoke=box(head,dark,.1,2.9,.09,-.19,0,0);spoke.rotation.x=a;
      for(let r of [.55,1.03]){const bit=box(head,ivory,.21,.19,.22,-.26,Math.cos(a+.12)*r,Math.sin(a+.12)*r);bit.rotation.x=a;}
    }
    for(let x of [-.8,.9])for(let z of [-1.15,1.15])box(g,accent,.6,.18,.23,x,.42,z);
    for(let z of [-.8,.8])tube(g,accent,[[-1,2.6,z],[0,2.8,z],[1.5,2.65,z],[2.2,1.4,z]],.07);
    box(g,dark,.8,.55,1.1,2.1,1.15);
  }
  return g;
}

function xyz(lon,lat,r){const phi=(90-lat)*Math.PI/180,theta=(lon+180)*Math.PI/180;return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta))}

export class IndustrialScene {
  constructor(el,{kind='hero', reduced=false,onReady=()=>{}}={}){
    this.el=el;this.kind=kind;this.reduced=reduced;this.visible=false;this.disposed=false;this.progress=0;this.current=0;this.target=0;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(kind==='winter'?0xc7d2d2:0x171b1d);this.scene.fog=new THREE.Fog(this.scene.background,18,48);
    this.camera=new THREE.PerspectiveCamera(32,1,.1,180);
    // Dense screens hide aliasing on their own; small screens get cheaper shadows.
    const dense=window.devicePixelRatio>=2,compact=innerWidth<650;this.compact=compact;
    this.renderer=new THREE.WebGLRenderer({antialias:!dense,alpha:false,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=compact?THREE.PCFShadowMap:THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;el.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-hidden','true');
    this.scene.add(new THREE.HemisphereLight(0xe3f1ff,0x35332c,2.7));
    const key=new THREE.DirectionalLight(0xffead6,4.7);key.position.set(-5,12,7);key.castShadow=true;key.shadow.mapSize.setScalar(this.compact?512:1024);key.shadow.camera.left=-16;key.shadow.camera.right=16;key.shadow.camera.top=14;key.shadow.camera.bottom=-14;key.shadow.normalBias=.045;this.scene.add(key);
    const rim=new THREE.DirectionalLight(0xa8c7df,3.3);rim.position.set(4,6,-7);this.scene.add(rim);
    this.world=new THREE.Group();this.scene.add(this.world);
    this.loads=[];
    if(kind==='globe')this.createGlobe();else{
      const floor=mesh(this.world,new THREE.PlaneGeometry(160,160),material(kind==='winter'?0xbec9ca:0x1a1f21,.1,.82),0,-.02);floor.rotation.x=-Math.PI/2;floor.castShadow=false;
      this.truck=truck();this.world.add(this.truck);
      const types=kind==='hero'?['machine','transformer','turbine','yacht','helicopter','turbine']:kind==='container'?['container']:kind==='hvac'?['hvac']:kind==='end'?[]:['turbine'];
      types.forEach(t=>{const g=load(t);g.position.set(.6,1.26,0);g.visible=false;this.truck.add(g);this.loads.push(g)});
      const routeMat=new THREE.MeshBasicMaterial({color:GREEN});
      this.route=tube(this.world,routeMat,[[-40,.025,2.15],[-9,.025,2.15],[1,.025,2.15],[8,.025,2.15],[15,.025,-4],[40,.025,-4]],.03);
      if(kind==='winter'){
        const mountainMat=material(0x718488,.08,.96);
        for(let i=0;i<18;i++){const m=mesh(this.world,new THREE.ConeGeometry(1.8+(i%4)*.9,2+(i%5)*1.1,5),mountainMat,-25+i*3,1.0,-10-(i%3)*3);m.rotation.y=i;}
        const pts=[];for(let i=0;i<340;i++)pts.push(Math.sin(i*47.1)*19,1+(i%71)/7,Math.cos(i*31.7)*11);
        const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));this.snow=new THREE.Points(geo,new THREE.PointsMaterial({color:0xffffff,size:.042,transparent:true,opacity:.7}));this.world.add(this.snow);
      }
    }
    this.resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);this.mobile=w<650;this.onScroll?.();this.dirty=true;this.draw()};
    this.ro=new ResizeObserver(this.resize);this.ro.observe(el);
    this.onScroll=()=>{if(this.visible===false)return;const r=el.getBoundingClientRect();if(kind==='hero'&&innerWidth>650){const frame=el.closest('.hero-layout').getBoundingClientRect();this.target=clamp((35-frame.top)/(frame.height-innerHeight+100));}else if(kind==='hero'){const start=window.scrollY+el.closest('.hero').getBoundingClientRect().top;this.target=clamp((window.scrollY-Math.max(80,start))/650);}else{this.target=clamp((window.innerHeight-r.top)/(window.innerHeight+r.height));}this.dirty=true;};
    window.addEventListener('scroll',this.onScroll,{passive:true});this.onScroll();
    this.io=new IntersectionObserver(([entry])=>{this.visible=entry.isIntersecting;if(this.visible){this.onScroll();this.start();}else this.stop()},{rootMargin:'80px'});this.io.observe(el);
    this.onVisibility=()=>document.hidden?this.stop():this.visible&&this.start();document.addEventListener('visibilitychange',this.onVisibility);
    this.resize();onReady();
  }
  createGlobe(){
    this.globe=new THREE.Group();this.world.add(this.globe);
    mesh(this.globe,new THREE.SphereGeometry(4,64,48),material(0x243338,.45,.8));
    const lineMat=new THREE.LineBasicMaterial({color:0x506364,transparent:true,opacity:.32});
    for(let lat=-60;lat<=60;lat+=30){let pts=[];for(let lon=-180;lon<=180;lon+=3)pts.push(xyz(lon,lat,4.012));this.globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),lineMat));}
    for(let lon=-180;lon<180;lon+=30){let pts=[];for(let lat=-90;lat<=90;lat+=3)pts.push(xyz(lon,lat,4.012));this.globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),lineMat));}
    fetch(landUrl).then(r=>r.json()).then(data=>{
      if(this.disposed)return;
      const mat=new THREE.LineBasicMaterial({color:0xb3bcb4,transparent:true,opacity:.75});
      data.features.forEach(f=>{const polys=f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates];polys.forEach(poly=>poly.forEach(ring=>this.globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring.map(([lon,lat])=>xyz(lon,lat,4.025))),mat))))});this.dirty=true;this.draw();
    }).catch(()=>{});
    this.arcs=[];const paths=[[[121,31],[86,69]],[[120,36],[41,43]],[[113,23],[37,56]]];
    paths.forEach(([a,b])=>{const av=xyz(...a,4.06),bv=xyz(...b,4.06),mid=av.clone().add(bv).normalize().multiplyScalar(5.4);const curve=new THREE.QuadraticBezierCurve3(av,mid,bv);const arc=mesh(this.globe,new THREE.TubeGeometry(curve,60,.025,6,false),new THREE.MeshBasicMaterial({color:GREEN}));this.arcs.push(arc);for(let p of [av,bv])mesh(this.globe,new THREE.SphereGeometry(.065,12,8),new THREE.MeshBasicMaterial({color:0x7fd8a6}),p.x,p.y,p.z);});
  }
  start(){if(this.frame||this.disposed)return;this.draw();if(!this.reduced)this.frame=requestAnimationFrame(()=>this.tick());}
  stop(){cancelAnimationFrame(this.frame);this.frame=0;}
  tick(){this.frame=0;if(!this.visible||document.hidden||this.disposed)return;this.draw();this.frame=requestAnimationFrame(()=>this.tick());}
  draw(){
    if(this.disposed)return;
    const p=this.reduced?.38:this.target;this.progress+=(p-this.progress)*.09;
    const t=this.progress;
    if(this.kind==='globe'){
      this.globe.rotation.y=-2.1+(this.reduced?0:t)*1.25;this.globe.rotation.z=-.17;
      this.camera.position.set(0,2.5,this.mobile?17:14.7);this.camera.lookAt(0,0,0);
      this.arcs.forEach((a,i)=>a.visible=this.reduced||t>.1+i*.12);
    }else{
      const hero=this.kind==='hero',winter=this.kind==='winter';
      let cargo=hero?Math.floor(t*7)-1:0;
      if(this.reduced&&hero)cargo=-1;
      this.loads.forEach((g,i)=>{g.visible=i===Math.min(cargo,this.loads.length-1);if(g.visible){g.position.y=1.26+(hero?(1-smooth(clamp(((t*7)%1)*3)))*.7:0);if(g.userData.head){g.userData.head.rotation.x=this.reduced?0:t*2;if(winter&&!this.reduced){g.userData.head.position.x=-2-Math.sin(t*Math.PI)*.7;}}}});
      if(this.kind==='end')this.truck.rotation.y=this.reduced?0:(t-.5)*.3;
      else this.truck.rotation.y=hero?(t-.36)*.55:(t-.5)*.35;
      this.camera.position.set(this.mobile?-12.8:-10.5, this.mobile?9:5.9+(hero?t*1.8:0),this.mobile?20:13.5);
      this.camera.lookAt(-.15,1.0,0);
      if(winter){this.camera.position.set(-11,8,this.mobile?21:16);this.camera.lookAt(.4,1.25,0);if(this.snow&&!this.reduced)this.snow.position.x=(t-.5)*5;}
      this.truck.userData.wheels.forEach(w=>w.rotation.z=this.reduced?0:-t*5);
    }
    this.renderer.render(this.scene,this.camera);
  }
  setReduced(reduced){this.reduced=reduced;this.stop();this.draw();if(this.visible)this.start();}
  dispose(){this.disposed=true;this.stop();this.ro.disconnect();this.io.disconnect();window.removeEventListener('scroll',this.onScroll);document.removeEventListener('visibilitychange',this.onVisibility);this.scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())});this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();}
}
