/* ── Word Split ── */
function splitWords(el) {
  function wrap(parent) {
    Array.from(parent.childNodes).forEach(node => {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(w => {
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); }
          else if (w) {
            const outer = document.createElement('span');
            outer.className = 'word-wrap';
            const inner = document.createElement('span');
            inner.className = 'word-inner';
            inner.textContent = w;
            outer.appendChild(inner);
            frag.appendChild(outer);
          }
        });
        parent.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName !== 'BR') {
        wrap(node);
      }
    });
  }
  wrap(el);
  return el.querySelectorAll('.word-inner');
}

/* ── Hero text split (on load) ── */
const heroSplit = document.querySelector('[data-split="hero"]');
if (heroSplit) {
  const words = splitWords(heroSplit);
  setTimeout(() => {
    words.forEach((w, i) => {
      setTimeout(() => w.classList.add('show'), i * 55);
    });
  }, 250);
}

/* ── Scroll text splits ── */
document.querySelectorAll('[data-split="scroll"]').forEach(el => {
  const words = splitWords(el);
  const obs = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      words.forEach((w, i) => setTimeout(() => w.classList.add('show'), i * 40));
      obs.disconnect();
    }
  }, { threshold: 0.1 });
  obs.observe(el);
});

/* ── Scroll reveals ── */
const rvObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('show'); rvObs.unobserve(e.target); }
  });
}, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });
document.querySelectorAll('.rv').forEach(el => rvObs.observe(el));

/* ── Skill tags stagger ── */
const tagObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.sk-tag').forEach((t, i) => {
        setTimeout(() => t.classList.add('show'), i * 40);
      });
      tagObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('[data-stagger]').forEach(el => tagObs.observe(el));

/* ── Nav tracking ── */
const navLinks = document.querySelectorAll('.nav-link');
const navObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(l => l.classList.toggle('active', l.dataset.s === e.target.id));
    }
  });
}, { threshold: 0.3 });
['about','work','skills','contact'].forEach(id => {
  const el = document.getElementById(id);
  if (el) navObs.observe(el);
});

/* ── Contact form ── */
async function sendForm() {
  const name = document.getElementById('cf-name').value.trim();
  const email = document.getElementById('cf-email').value.trim();
  const msg = document.getElementById('cf-msg').value.trim();
  const note = document.getElementById('cf-note');
  const btn = document.getElementById('cf-btn');
  if (!name || !email || !msg) { note.textContent = 'Please fill in all fields.'; note.style.color = '#e55'; return; }
  btn.textContent = 'Sending...'; btn.disabled = true; note.textContent = '';
  try {
    const res = await fetch('https://formspree.io/f/xjgaylzy', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ name, email, message: msg })
    });
    if (res.ok) {
      note.textContent = "Message sent — I'll get back to you soon."; note.style.color = '#34c759';
      document.getElementById('cf-name').value = ''; document.getElementById('cf-email').value = ''; document.getElementById('cf-msg').value = '';
      btn.textContent = 'Sent ✓';
      setTimeout(() => { btn.textContent = 'Send Message'; btn.disabled = false; note.textContent = ''; }, 4000);
    } else throw new Error();
  } catch(e) {
    note.textContent = 'Something went wrong. Try emailing directly.'; note.style.color = '#e55';
    btn.textContent = 'Send Message'; btn.disabled = false;
  }
}

/* ── GitHub API (live data) ── */
async function loadGitHub() {
  try {
    const res = await fetch('https://api.github.com/users/nithinchd04');
    if (!res.ok) return;
    const u = await res.json();
    document.getElementById('gh-repos').textContent = u.public_repos ?? '17';
    document.getElementById('gh-followers').textContent = u.followers ?? '2';
    document.getElementById('gh-following').textContent = u.following ?? '1';

    const reposRes = await fetch('https://api.github.com/users/nithinchd04/repos?sort=updated&per_page=3');
    const repos = await reposRes.json();
    let stars = 0;
    const list = document.getElementById('gh-repos-list');
    if (Array.isArray(repos) && repos.length) {
      list.innerHTML = '';
      repos.forEach(r => {
        stars += r.stargazers_count || 0;
        const el = document.createElement('div');
        el.className = 'gh-repo';
        el.innerHTML = '<a href="'+r.html_url+'" target="_blank" class="gh-repo-name">'+r.name+'</a><div class="gh-repo-meta"><span>'+(r.language||'')+'</span><span>★ '+r.stargazers_count+'</span></div>';
        list.appendChild(el);
      });
    }
    document.getElementById('gh-stars').textContent = stars;
  } catch(e) { /* keep fallback values */ }
}
loadGitHub();

/* ── Learning bars animate on scroll ── */
const barObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.learn-bar').forEach((bar, i) => {
        setTimeout(() => {
          bar.style.transform = 'scaleX(' + (bar.dataset.w / 100) + ')';
          bar.classList.add('show');
        }, i * 120);
      });
      barObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.learn-list').forEach(el => barObs.observe(el));

/* ── Reflex Lab game ── */
(function(){
  var state='idle', timer=null, t0=0, best=null, attempts=0;
  function el(id){ return document.getElementById(id); }
  function setClass(s){ el('rfxWidget').className='rfx-widget'+(s?' s-'+s:''); }

  function rfxClick(){
    if(state==='idle'||state==='result'||state==='early'){ beginWait(); }
    else if(state==='wait'){ tooEarly(); }
    else if(state==='go'){ measure(); }
  }

  function beginWait(){
    clearTimeout(timer);
    state='wait'; setClass('wait');
    el('rfxLbl').innerHTML='Wait...';
    el('rfxGrade').textContent=''; el('rfxGrade').className='rfx-grade';
    el('rfxBar').style.width='0%';
    el('rfxAgain').style.display='none';
    timer=setTimeout(function(){
      state='go'; setClass('go');
      el('rfxLbl').innerHTML='TAP!';
      t0=performance.now();
    }, 1500+Math.random()*2500);
  }

  function tooEarly(){
    clearTimeout(timer);
    state='early'; setClass('');
    attempts++;
    el('rfxAttempts').textContent=attempts+(attempts===1?' attempt':' attempts');
    el('rfxLbl').innerHTML='Too<br>Early!';
    el('rfxGrade').textContent='× jumped the gun';
    el('rfxGrade').className='rfx-grade g-early';
    el('rfxAgain').style.display='';
  }

  function measure(){
    var ms=Math.round(performance.now()-t0);
    state='result'; setClass('');
    attempts++;
    el('rfxAttempts').textContent=attempts+(attempts===1?' attempt':' attempts');
    if(best===null||ms<best){ best=ms; el('rfxBest').textContent=ms+'ms'; }
    el('rfxLbl').innerHTML='<span class="rfx-time-big">'+ms+'</span><span class="rfx-time-unit">ms</span>';
    var cls,txt;
    if(ms<200){cls='g-lightning';txt='⚡ Lightning';}
    else if(ms<280){cls='g-fast';txt='▲ Fast';}
    else if(ms<380){cls='g-good';txt='✓ Good';}
    else{cls='g-slow';txt='↓ Slow';}
    el('rfxGrade').textContent=txt; el('rfxGrade').className='rfx-grade '+cls;
    var pct=Math.max(5,Math.min(100,Math.round((1-(ms-150)/350)*100)));
    var barColor=ms<280?'#34c759':ms<380?'#0071e3':'#fbbf24';
    el('rfxBar').style.background=barColor;
    setTimeout(function(){ el('rfxBar').style.width=pct+'%'; },80);
    el('rfxAgain').style.display='';
  }

  function rfxReset(){
    state='idle'; setClass('');
    el('rfxLbl').innerHTML='Click<br>to Start';
    el('rfxGrade').textContent=''; el('rfxGrade').className='rfx-grade';
    el('rfxBar').style.width='0%';
    el('rfxAgain').style.display='none';
  }

  window.rfxClick=rfxClick;
  window.rfxReset=rfxReset;
})();

