(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let IDX = null, PAGES = [], BYROUTE = {}, SEARCH = null;
  let LANG = 'en';
  try { LANG = localStorage.getItem('econ-lang') === 'zh' ? 'zh' : 'en'; } catch {}

  // ---------- theme
  const themeBtn = $('#theme');
  const setThemeLabel = () => { themeBtn.querySelector('span').textContent = document.documentElement.dataset.theme === 'dark' ? '浅色' : '深色'; };
  themeBtn.onclick = () => {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('econ-theme', t); } catch {}
    setThemeLabel();
  };
  setThemeLabel();

  // ---------- index
  function flatten() {
    PAGES = [];
    for (const s of IDX.sections) {
      const sec = { num: s.num, title: s.title, slug: s.slug };
      if (s.page) PAGES.push({ ...s.page, sec, label: s.title });
      if (s.intro) PAGES.push({ ...s.intro, sec, label: 'Overview' });
      for (const b of s.subs) {
        const sub = { num: b.num, title: b.title, slug: b.slug };
        if (b.page) PAGES.push({ ...b.page, sec, sub, label: b.title });
        if (b.intro) PAGES.push({ ...b.intro, sec, sub, label: 'Overview' });
        for (const p of b.papers) PAGES.push({ ...p, sec, sub, label: p.title });
      }
    }
    PAGES.forEach((p, i) => { p.i = i; BYROUTE[p.route] = p; });
  }
  const secCount = s => s.page ? 1 : s.subs.reduce((n, b) => n + (b.page ? 1 : b.papers.length), 0);
  const firstRoute = s => s.page ? s.page.route : null;

  // ---------- header tabs
  function renderTabs(active) {
    $('#tabs').innerHTML = IDX.sections.map(s =>
      `<a href="#/${s.slug}" class="${s.slug === active ? 'active' : ''}"><span class="code">${s.num}</span>${esc(s.title)}</a>`).join('');
  }

  // ---------- sidebar
  function renderToc(secSlug, route) {
    const toc = $('#toc');
    if (!secSlug) {
      $('#aside-title').textContent = '全部领域';
      toc.innerHTML = '<div class="toc-group">' + IDX.sections.map(s =>
        `<a class="toc-item" href="#/${s.slug}"><span class="code">${s.num}</span><span>${esc(s.title)}</span><small>${secCount(s)}</small></a>`).join('') + '</div>';
      return;
    }
    const s = IDX.sections.find(x => x.slug === secSlug);
    $('#aside-title').innerHTML = `<span class="code">${s.num}</span>${esc(s.title)}`;
    let h = '';
    if (s.page) h += item(s.page, s.title, route);
    if (s.intro) h += item(s.intro, 'Overview', route, 'ov');
    for (const b of s.subs) {
      if (b.page) { h += `<div class="toc-group single">${item(b.page, b.title, route, 'sub')}</div>`; continue; }
      const open = route && route.startsWith(`${s.slug}/${b.slug}/`);
      h += `<details class="toc-group" ${open || s.subs.length <= 6 ? 'open' : ''}><summary><span class="code">${b.num}</span>${esc(b.title)}<small>${b.papers.length}</small></summary>`;
      if (b.intro) h += item(b.intro, 'Overview', route, 'ov');
      for (const p of b.papers) h += item(p, p.title, route);
      h += '</details>';
    }
    toc.innerHTML = h;
    const act = toc.querySelector('.active');
    if (act) act.scrollIntoView({ block: 'nearest' });
  }
  function item(p, label, route, cls = '') {
    return `<a class="toc-item ${cls} ${p.route === route ? 'active' : ''} ${p.empty ? 'is-empty' : ''}" href="#/${p.route}"><span class="code">${cls === 'ov' ? '' : p.num}</span><span>${esc(label)}</span></a>`;
  }

  // ---------- views
  function home() {
    const m = IDX.meta;
    const cards = IDX.sections.map(s => {
      const subs = s.subs.map(b => `<li><a href="#/${b.page ? b.page.route : (b.intro ? b.intro.route : b.papers[0].route)}"><span class="code">${b.num}</span>${esc(b.title)}</a><small>${b.page ? '' : b.papers.length}</small></li>`).join('');
      return `<article class="sec-card"><h3><a href="#/${s.slug}"><span class="code">${s.num}</span>${esc(s.title)}</a></h3>${subs ? `<ul>${subs}</ul>` : `<p class="muted">${s.page && s.page.empty ? '笔记待补充' : '单页笔记'}</p>`}</article>`;
    }).join('');
    $('#content').innerHTML = `
      <section class="intro"><div><div class="eyebrow">THE MODEL NOTEBOOK</div><h1>从一篇论文，读懂一个模型。</h1><p>逐篇整理经济学经典与前沿论文中的模型设定、均衡条件与推导细节。<br>上方按领域切换，左侧按主题与论文浏览，每篇论文一页。</p></div><a class="pdf" href="#/about">关于这份笔记 <span>编者与项目说明 →</span></a></section>
      <section class="stats" aria-label="笔记概况"><div><strong>${IDX.sections.length}</strong><span>研究领域</span></div><div><strong>${IDX.sections.reduce((n, s) => n + s.subs.length, 0)}</strong><span>主题</span></div><div><strong>${PAGES.filter(p => p.kind === 'paper' || p.kind === 'subsection').length}</strong><span>模型与论文</span></div><div><strong>${m.equations.toLocaleString()}</strong><span>编号公式</span></div></section>
      <div class="sec-grid">${cards}</div>`;
  }

  function about() {
    const m = IDX.meta;
    $('#content').innerHTML = `<section class="about-page"><div class="eyebrow">ABOUT THE PROJECT</div><h1>为研究者整理的模型笔记。</h1>
      <p>本站内容来自 Zhiren Hu（Cornell）的阅读笔记 <em>Economic Models</em>（${esc(m.version)} 版），按“领域—主题—论文”组织：上方切换领域，左侧选择主题与论文，每篇论文占据完整页面，包含模型设定、均衡推导与参考文献。</p>
      <p>公式编号与原笔记一致（领域.主题.论文.序号）。笔记为个人学习整理，引用时请以论文原文为准；如发现错误欢迎指正。</p>
      <p class="muted">共 ${m.pages} 个页面、${m.equations.toLocaleString()} 个编号公式、${m.references} 篇参考文献。网站由 LaTeX 源文件自动生成，公式由 KaTeX 渲染。</p>
      <p><a href="https://econ-data.github.io/" target="_blank" rel="noopener">Econ Datalab · 研究数据与文献目录 ↗</a></p></section>`;
  }

  function sectionView(s) {
    if (s.page) return page(s.page.route);
    let h = `<div class="crumbs"><a href="#/">全部领域</a> › ${esc(s.title)}</div><h1 class="page-title"><span class="code">${s.num}</span>${esc(s.title)}</h1>`;
    if (s.intro) h += `<p><a href="#/${s.intro.route}">Overview →</a></p>`;
    for (const b of s.subs) {
      h += `<section class="sub-block"><h2><span class="code">${b.num}</span>${esc(b.title)}</h2>`;
      if (b.page) h += `<a class="paper-row" href="#/${b.page.route}"><span class="code">${b.page.num}</span><span class="pt">${esc(b.title)}</span>${meta(b.page)}</a>`;
      if (b.intro) h += `<a class="paper-row ov" href="#/${b.intro.route}"><span class="code"></span><span class="pt">Overview</span>${meta(b.intro)}</a>`;
      for (const p of b.papers) h += `<a class="paper-row" href="#/${p.route}"><span class="code">${p.num}</span><span class="pt">${esc(p.title)}</span>${meta(p)}</a>`;
      h += '</section>';
    }
    $('#content').innerHTML = h;
  }
  const meta = p => p.empty ? '<small class="pm">待补充</small>' : `<small class="pm">${p.eqs ? p.eqs + ' 个公式' : ''}${p.eqs && p.refs ? ' · ' : ''}${p.refs ? p.refs + ' 篇文献' : ''}</small>`;

  async function page(route, anchor) {
    closeDeriv();
    const p = BYROUTE[route];
    if (!p) { $('#content').innerHTML = '<p class="empty">未找到该页面。<a href="#/">返回首页</a></p>'; return; }
    const prev = PAGES[p.i - 1], next = PAGES[p.i + 1];
    const crumbs = [`<a href="#/">全部领域</a>`, `<a href="#/${p.sec.slug}">${esc(p.sec.title)}</a>`];
    if (p.sub && p.kind !== 'subsection') crumbs.push(`<span>${esc(p.sub.title)}</span>`);
    const title = p.label === 'Overview' ? `${esc((p.sub || p.sec).title)} <small>Overview</small>` : esc(p.title);
    const zh = !!p.zh && LANG === 'zh';
    const hl = zh ? p.zh : (p.heads || []);
    const heads = hl.length > 2 ? `<div class="qnav">${hl.map(([id, t]) => `<a data-jump="${id}">${esc(t)}</a>`).join('')}</div>` : '';
    const langBtn = p.zh ? `<button type="button" class="lang-toggle" id="lang-toggle" title="${zh ? 'Switch to English' : '切换到中文版本'}">${zh ? 'English' : '中文版'}</button>` : '';
    $('#content').innerHTML = `<div class="crumbs">${crumbs.join(' › ')}</div><h1 class="page-title"><span class="code">${p.label === 'Overview' ? (p.sub || p.sec).num : p.num}</span>${title}</h1>
      <div class="page-meta"><span>${p.eqs ? `${p.eqs} 个编号公式` : ''}${p.eqs && p.refs ? ' · ' : ''}${p.refs ? `${p.refs} 篇参考文献` : ''}${p.derivs || p.expls ? ` · <span class="deriv-hint">点击公式查看${[p.derivs ? `推导（${p.derivs}）` : '', p.expls ? `解释（${p.expls}）` : ''].filter(Boolean).join('或')}</span>` : ''}</span>${langBtn}</div>${heads}
      <article class="note" id="note"><p class="muted">正在读取…</p></article>
      <div class="pager">${prev ? `<a href="#/${prev.route}" class="prev"><small>← 上一篇</small>${esc(prev.label === 'Overview' ? (prev.sub || prev.sec).title + ' · Overview' : prev.title)}</a>` : '<span></span>'}${next ? `<a href="#/${next.route}" class="next"><small>下一篇 →</small>${esc(next.label === 'Overview' ? (next.sub || next.sec).title + ' · Overview' : next.title)}</a>` : '<span></span>'}</div>`;
    if (p.zh) $('#lang-toggle').addEventListener('click', () => {
      LANG = zh ? 'en' : 'zh';
      try { localStorage.setItem('econ-lang', LANG); } catch {}
      page(route);
    });
    try {
      const r = await fetch(`notes/${route}${zh ? '.zh' : ''}.html`);
      const html = await r.text();
      const note = $('#note');
      note.innerHTML = html.trim() ? html : '<p class="empty">这一节的笔记待补充。</p>';
      if (anchor) { const el = document.getElementById(anchor); if (el) el.scrollIntoView(); }
    } catch (e) { $('#note').innerHTML = '<p class="empty">读取失败。</p>'; }
  }

  // ---------- search
  let searchTimer = null;
  async function runSearch(q) {
    q = q.trim();
    if (!q) { route(); return; }
    if (!SEARCH) SEARCH = await (await fetch('search.json')).json();
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const res = [];
    for (const it of SEARCH) {
      const p = BYROUTE[it.r]; if (!p) continue;
      const hay = (p.title + ' ' + (p.sub ? p.sub.title : '') + ' ' + p.sec.title + ' ' + it.t).toLowerCase();
      if (!terms.every(t => hay.includes(t))) continue;
      const inTitle = terms.every(t => (p.title + ' ' + (p.sub ? p.sub.title : '')).toLowerCase().includes(t));
      const k = it.t.toLowerCase().indexOf(terms[0]);
      const snip = k >= 0 ? (k > 60 ? '…' : '') + it.t.slice(Math.max(0, k - 60), k + 160) + '…' : it.t.slice(0, 200) + '…';
      res.push({ p, snip, score: inTitle ? 0 : 1 });
    }
    res.sort((a, b) => a.score - b.score || a.p.i - b.p.i);
    const hl = s => { let h = esc(s); for (const t of terms) h = h.replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`); return h; };
    $('#content').innerHTML = `<div class="results-heading"><h2>搜索：${esc(q)}</h2><span>${res.length} 个页面</span></div>` +
      (res.length ? res.slice(0, 80).map(({ p, snip }) => `<a class="search-hit" href="#/${p.route}"><div class="sh-path">${esc(p.sec.title)}${p.sub ? ' › ' + esc(p.sub.title) : ''}</div><div class="sh-title"><span class="code">${p.num}</span>${hl(p.label === 'Overview' ? (p.sub || p.sec).title + ' · Overview' : p.title)}</div><p>${hl(snip)}</p></a>`).join('') : '<p class="empty">没有找到匹配的笔记。</p>');
  }
  $('#search').addEventListener('input', e => { clearTimeout(searchTimer); searchTimer = setTimeout(() => runSearch(e.target.value), 180); });
  document.addEventListener('keydown', e => { if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); $('#search').focus(); } });

  // ---------- in-page links: footnotes, citations, heading chips
  document.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return;
    let target = null;
    if (a.dataset.fn) target = document.getElementById('fn-' + a.dataset.fn);
    else if (a.dataset.fnback) target = document.getElementById('fnref-' + a.dataset.fnback);
    else if (a.dataset.ref) target = document.getElementById('ref-' + a.dataset.ref);
    else if (a.dataset.jump) target = document.getElementById(a.dataset.jump);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: a.dataset.jump ? 'start' : 'center' });
      target.classList.remove('flash'); void target.offsetWidth; target.classList.add('flash');
    }
  });

  // ---------- derivation side panel (click a numbered equation that has a derivation)
  let DERIV_EQ = null;
  function derivPanel() {
    let el = document.getElementById('deriv-panel');
    if (el) return el;
    el = document.createElement('aside');
    el.id = 'deriv-panel'; el.setAttribute('aria-hidden', 'true'); el.setAttribute('aria-label', '公式推导');
    el.innerHTML = `<div class="dp-head"><div class="dp-title"><span class="dp-label">推导</span><span class="dp-tag"></span></div>
      <div class="dp-nav"><button type="button" class="dp-prev" title="上一个推导">‹</button><button type="button" class="dp-next" title="下一个推导">›</button><button type="button" class="dp-close" title="关闭 (Esc)">×</button></div></div>
      <div class="dp-body"><div class="dp-target"></div><div class="dp-steps note"></div></div>`;
    document.body.appendChild(el);
    el.querySelector('.dp-close').addEventListener('click', closeDeriv);
    el.querySelector('.dp-prev').addEventListener('click', () => stepDeriv(-1));
    el.querySelector('.dp-next').addEventListener('click', () => stepDeriv(1));
    return el;
  }
  function derivEqs() { return [...document.querySelectorAll('#note .eq.has-deriv')]; }
  function openDeriv(eq) {
    const k = eq.dataset.eq;
    const src = document.querySelector(`#note .deriv-store .deriv[data-k="${k}"]`);
    if (!src) return;
    const el = derivPanel();
    if (DERIV_EQ) DERIV_EQ.classList.remove('deriv-active');
    DERIV_EQ = eq; eq.classList.add('deriv-active');
    const tag = eq.querySelector('.tag');
    el.querySelector('.dp-label').textContent = eq.dataset.kind === 'explanation' ? '解释' : '推导';
    el.querySelector('.dp-tag').textContent = tag ? tag.textContent.trim() : '(' + k + ')';
    el.querySelector('.dp-target').innerHTML = eq.innerHTML;
    el.querySelector('.dp-steps').innerHTML = src.innerHTML;
    const all = derivEqs(), i = all.indexOf(eq);
    el.querySelector('.dp-prev').disabled = i <= 0;
    el.querySelector('.dp-next').disabled = i >= all.length - 1;
    el.querySelector('.dp-body').scrollTop = 0;
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('deriv-open');
    setTimeout(() => {  // after the layout transition
      if (DERIV_EQ !== eq) return;
      const r = eq.getBoundingClientRect();
      if (r.top < 60 || r.bottom > innerHeight - 40) eq.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 260);
  }
  function stepDeriv(d) {
    const all = derivEqs(), i = all.indexOf(DERIV_EQ);
    const t = all[i + d]; if (t) openDeriv(t);
  }
  function closeDeriv() {
    if (DERIV_EQ) DERIV_EQ.classList.remove('deriv-active');
    DERIV_EQ = null;
    document.body.classList.remove('deriv-open');
    const el = document.getElementById('deriv-panel');
    if (el) el.setAttribute('aria-hidden', 'true');
  }
  document.addEventListener('click', e => {
    if (e.target.closest('a, button, #deriv-panel')) return;
    const eq = e.target.closest('#note .eq.has-deriv');
    if (!eq) return;
    if (window.getSelection && String(window.getSelection()).length) return;  // let users select math text
    if (eq === DERIV_EQ) closeDeriv(); else openDeriv(eq);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && DERIV_EQ) { closeDeriv(); return; }
    const eq = e.target.closest && e.target.closest('#note .eq.has-deriv');
    if (eq && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDeriv(eq); }
    if (DERIV_EQ && document.activeElement.tagName !== 'INPUT' && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && e.altKey) { e.preventDefault(); stepDeriv(e.key === 'ArrowDown' ? 1 : -1); }
  });

  // ---------- router
  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    $('#nav-home').classList.toggle('active', h !== 'about');
    $('#nav-about').classList.toggle('active', h === 'about');
    if (!h) { renderTabs(null); renderToc(null); home(); document.title = 'Econ Model · 经济学模型笔记'; return; }
    if (h === 'about') { renderTabs(null); renderToc(null); about(); document.title = '关于 · Econ Model'; return; }
    const [path, anchor] = h.split('#');
    const secSlug = path.split('/')[0];
    const s = IDX.sections.find(x => x.slug === secSlug);
    renderTabs(secSlug);
    if (!s) { renderToc(null); $('#content').innerHTML = '<p class="empty">未找到该页面。<a href="#/">返回首页</a></p>'; return; }
    if (path === secSlug && !s.page) { renderToc(secSlug, null); sectionView(s); document.title = `${s.title} · Econ Model`; }
    else { const r = s.page && path === secSlug ? s.page.route : path; renderToc(secSlug, r); page(r, anchor); const p = BYROUTE[r]; document.title = `${p ? (p.label === 'Overview' ? (p.sub || p.sec).title : p.title) : ''} · Econ Model`; }
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', () => { $('#search').value = ''; route(); });

  fetch('notes/index.json').then(r => r.json()).then(d => { IDX = d; flatten(); route(); })
    .catch(() => { $('#content').innerHTML = '<p class="empty">目录读取失败，请通过本地服务器或 GitHub Pages 访问。</p>'; });
})();
