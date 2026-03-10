document.addEventListener('DOMContentLoaded', () => {
    if (!('IntersectionObserver' in window)) return;
  
    // Observer #1: one-time reveal
    const io = new IntersectionObserver((entries, obs) => {
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue;
        target.classList.add('in');
        obs.unobserve(target);
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -10% 0px" });
  
    document.querySelectorAll('.reveal, .fx').forEach(el => io.observe(el));
  
    // Observer #2: live toggle for .fx elements
    const io2 = new IntersectionObserver(entries => {
      for (const { isIntersecting, target } of entries) {
        target.classList.toggle('in', isIntersecting);
      }
    }, { threshold: 0.2 });
  
    document.querySelectorAll('.fx').forEach(el => io2.observe(el));
  
    // Parallax progress var
    const sec = document.querySelector('.parallax');
    function progress(el) {
      const r = el.getBoundingClientRect(), vh = innerHeight;
      const start = vh * 0.9, end = vh * 0.1;
      const t = (start - r.top) / (start - end);
      return Math.min(1, Math.max(0, t));
    }
    function update() { if (sec) sec.style.setProperty('--p', progress(sec)); }
  
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    }, { passive: true });
  
    update();
  
    // tiny debug so you can see it’s running
    console.log('[animations.js] ready, observed:',
      document.querySelectorAll('.reveal, .fx').length,
      'parallax:', !!sec);
  });
  /*-- -------------------------- -->
  <---       Confetti On Submit    -->
  <--- -------------------------- -*/
   const COLORS = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#B28DFF','#F073E8'];
    const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  
    function makeCanvas() {
      const c = document.createElement('canvas');
      c.className = 'confetti-canvas';
      Object.assign(c.style, {
        position:'fixed', inset:'0', width:'100%', height:'100%',
        pointerEvents:'none', zIndex: 9999
      });
      document.body.appendChild(c);
      const ctx = c.getContext('2d');
      const dpr = devicePixelRatio || 1;
      function resize(){
        c.width = innerWidth * dpr;
        c.height = innerHeight * dpr;
        ctx.setTransform(dpr,0,0,dpr,0,0);
      }
      addEventListener('resize', resize, { passive:true });
      resize();
      return { c, ctx, cleanup: () => {
        removeEventListener('resize', resize);
        c.remove();
      }};
    }
  
    function rand(min, max){ return Math.random() * (max - min) + min; }
    function pick(a){ return a[(Math.random()*a.length)|0]; }
  
    // Main API
    window.confetti = function confetti(opts = {}) {
      if (prefersReduced) return; // respect user setting
      const { c, ctx, cleanup } = makeCanvas();
  
      const count = opts.count ?? 100;
      const spread = opts.spread ?? 60;         // degrees
      const startVel = opts.startVelocity ?? 9; // px per frame
      const gravity = opts.gravity ?? 0.25;
      const drift = opts.drift ?? 0.4;          // sideways drift
      const decay = opts.decay ?? 0.98;         // velocity decay per frame
      const scalar = opts.scalar ?? 1;
  
      // origin in [0..1] viewport coords
      const ox = (opts.origin?.x ?? 0.5) * innerWidth;
      const oy = (opts.origin?.y ?? 0.3) * innerHeight;
  
      const pieces = Array.from({ length: count }, () => {
        const angle = (rand(-spread/2, spread/2) + (opts.angle ?? -90)) * Math.PI/180;
        return {
          x: ox, y: oy,
          vx: Math.cos(angle) * rand(startVel*0.7, startVel*1.3),
          vy: Math.sin(angle) * rand(startVel*0.7, startVel*1.3),
          w: rand(6,10) * scalar,
          h: rand(8,14) * scalar,
          r: rand(0, 2*Math.PI),
          vr: rand(-0.2, 0.2),
          color: pick(COLORS),
          alpha: 1,
          shape: Math.random() < 0.25 ? 'circle' : 'rect',
          tilt: rand(0, 2*Math.PI),
          vt: rand(0.08, 0.25),
          hueShift: Math.random() < 0.1
        };
      });
  
      let frame = 0;
      function drawPiece(p){
        ctx.globalAlpha = Math.max(p.alpha, 0);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
          ctx.beginPath(); ctx.arc(0,0, p.w * 0.6, 0, Math.PI*2); ctx.fill();
        } else {
          ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }
  
      function tick(){
        frame++;
        ctx.clearRect(0,0,innerWidth,innerHeight);
        let alive = 0;
  
        for (const p of pieces){
          // physics
          p.vx += (Math.sin(p.tilt) * drift) * 0.1;
          p.vy += gravity;
          p.vx *= decay; p.vy *= decay;
  
          p.x += p.vx;
          p.y += p.vy;
  
          p.r += p.vr;
          p.tilt += p.vt;
  
          // fade out near the end
          if (frame > 60) p.alpha -= 0.012;
          if (p.alpha > 0 && p.y < innerHeight + 50) {
            drawPiece(p);
            alive++;
          }
        }
  
        if (alive > 0) {
          requestAnimationFrame(tick);
        } else {
          cleanup();
        }
      }
      requestAnimationFrame(tick);
    };
  
    // Demo: click button (or call confetti() from your code)
    document.getElementById('win')?.addEventListener('click', () => {
      confetti({ count: 140, origin: { x: 0.5, y: 0.35 } });
    });