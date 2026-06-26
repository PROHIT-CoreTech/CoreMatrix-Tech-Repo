/* ---------- 3D background---------- */
const canvas=document.getElementById('bg-canvas');
let renderer,scene,camera,particles,knot,mouseX=0,mouseY=0;
function init3D(){
  scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x050a12,0.07);
  camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.1,100);
  camera.position.z=6;
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));

  // particle field
  const cnt=1400, g=new THREE.BufferGeometry(), pos=new Float32Array(cnt*3), col=new Float32Array(cnt*3);
  const c1=new THREE.Color(0x3fc5d4), c2=new THREE.Color(0x1e6f86);
  for(let i=0;i<cnt;i++){
    pos[i*3]=(Math.random()-.5)*22; pos[i*3+1]=(Math.random()-.5)*22; pos[i*3+2]=(Math.random()-.5)*18;
    const c=c1.clone().lerp(c2,Math.random());
    col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;
  }
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
  particles=new THREE.Points(g,new THREE.PointsMaterial({size:0.045,vertexColors:true,transparent:true,opacity:.85,blending:THREE.AdditiveBlending}));
  scene.add(particles);

  // floating wireframe knot — the "signature" 3D object
  const kg=new THREE.TorusKnotGeometry(1.4,.42,140,18,2,3);
  knot=new THREE.Mesh(kg,new THREE.MeshBasicMaterial({color:0x1e6f86,wireframe:true,transparent:true,opacity:.3}));
  knot.position.set(3.2,0,-2);
  scene.add(knot);

  const kg2=new THREE.IcosahedronGeometry(1.1,1);
  const ico=new THREE.Mesh(kg2,new THREE.MeshBasicMaterial({color:0x3fc5d4,wireframe:true,transparent:true,opacity:.24}));
  ico.position.set(-3.6,1.4,-3);
  scene.add(ico);
  window._ico=ico;

  animate();
}
function animate(){
  requestAnimationFrame(animate);
  const t=Date.now()*0.0002;
  particles.rotation.y=t*1.4; particles.rotation.x=t*.6;
  knot.rotation.x+=.004; knot.rotation.y+=.006;
  window._ico.rotation.x-=.003; window._ico.rotation.y+=.004;
  camera.position.x+=(mouseX*.6-camera.position.x)*.04;
  camera.position.y+=(-mouseY*.6-camera.position.y)*.04;
  camera.lookAt(scene.position);
  renderer.render(scene,camera);
}
addEventListener('mousemove',e=>{mouseX=(e.clientX/innerWidth-.5)*2;mouseY=(e.clientY/innerHeight-.5)*2;});
addEventListener('resize',()=>{if(!camera)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
try{init3D();}catch(e){console.warn('3D off',e);canvas.style.display='none';}

/* ---------- cursor glow ---------- */
const glow=document.getElementById('glow');
addEventListener('mousemove',e=>{glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px';});

/* ---------- nav ---------- */
const nav=document.getElementById('nav');
addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>40));
const burger=document.getElementById('burger'),navlinks=document.getElementById('navlinks');
burger.addEventListener('click',()=>navlinks.classList.toggle('open'));
navlinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>navlinks.classList.remove('open')));

/* ---------- scroll reveal ---------- */
const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}})},{threshold:.15});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* ---------- count + bars ---------- */
const cio=new IntersectionObserver((es)=>{es.forEach(e=>{
  if(!e.isIntersecting)return;
  const el=e.target;
  if(el.dataset.count){
    const suffix = el.dataset.suffix || '';
    const tgt=+el.dataset.count;let n=0;const step=Math.max(1,Math.ceil(tgt/40));
    const t=setInterval(()=>{n+=step;if(n>=tgt){n=tgt;clearInterval(t)}el.textContent=n + suffix;},28);}
  cio.unobserve(el);
})},{threshold:.6});
document.querySelectorAll('[data-count]').forEach(el=>cio.observe(el));

const bio=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.style.width=e.target.dataset.w+'%';bio.unobserve(e.target);}})},{threshold:.5});
document.querySelectorAll('.bar i').forEach(el=>bio.observe(el));

/* ---------- 3D tilt on service cards ---------- */
document.querySelectorAll('.svc-card').forEach(card=>{
  card.addEventListener('mousemove',e=>{
    const r=card.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
    card.style.transform=`perspective(900px) rotateY(${(x-.5)*12}deg) rotateX(${(.5-y)*12}deg) translateY(-4px)`;
    card.style.setProperty('--mx',(x*100)+'%');card.style.setProperty('--my',(y*100)+'%');
  });
  card.addEventListener('mouseleave',()=>{card.style.transform='';});
});