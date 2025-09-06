// Theme toggle with prefers-color-scheme fallback
(function(){
  const key = 'theme';
  const html = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const set = (val)=>{ html.dataset.theme = val; localStorage.setItem(key, val); };
  const saved = localStorage.getItem(key);
  if(saved){ set(saved); }
  btn && btn.addEventListener('click', ()=>{
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    set(next);
  });
})();
