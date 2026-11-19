// Particles
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let w, h, pts = [];
function resize(){ w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
function initPts(){ pts = Array.from({length: 70}, () => ({ x: Math.random()*w, y: Math.random()*h, vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3, r: Math.random()*1.6+0.4 })); }
function draw(){
  ctx.clearRect(0,0,w,h);
  for(const p of pts){
    p.x += p.vx; p.y += p.vy;
    if(p.x<0||p.x>w) p.vx*=-1;
    if(p.y<0||p.y>h) p.vy*=-1;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle='rgba(169,112,255,0.5)'; ctx.fill();
  }
  requestAnimationFrame(draw);
}
resize(); initPts(); draw();
window.addEventListener('resize', ()=>{ resize(); initPts(); });

// Reveal on scroll
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// Smooth anchor offset for fixed nav
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if(el){ e.preventDefault(); window.scrollTo({top: el.offsetTop - 70, behavior:'smooth'}); }
  });
});
