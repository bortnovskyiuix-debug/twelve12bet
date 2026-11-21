/* Table UX layer on top of the build: stage scaling, hand strength,
   fold guard, Esc for the bet slider, "your turn" in the tab title. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var uk = function () { var d = $('.dock'); return !!d && /[Ѐ-ӿ]/.test(d.textContent); };
  var T = {
    en: { hi: 'High card', pair: 'Pair', bpair: 'Pair on board', pp: 'Pocket pair', two: 'Two pair', trips: 'Trips', set: 'Set',
      str: 'Straight', fl: 'Flush', fh: 'Full house', quads: 'Four of a kind', sf: 'Straight flush', rf: 'Royal flush',
      fd: 'flush draw', sd: 'straight draw', gs: 'gutshot', fold: 'Check is free\nFold anyway?', turn: 'Your turn',
      rotate: 'Rotate your phone to play', toact: 'to act' },
    uk: { hi: 'Старша карта', pair: 'Пара', bpair: 'Пара на борді', pp: 'Кишенькова пара', two: 'Дві пари', trips: 'Трійка', set: 'Сет',
      str: 'Стріт', fl: 'Флеш', fh: 'Фул-хаус', quads: 'Каре', sf: 'Стріт-флеш', rf: 'Роял-флеш',
      fd: 'флеш-дро', sd: 'стріт-дро', gs: 'гатшот', fold: 'Чек безкоштовний\nВсе одно фолд?', turn: 'Ваш хід',
      rotate: 'Поверніть телефон вертикально', toact: 'ходить' }
  };
  var t = function (k) { return (uk() ? T.uk : T.en)[k]; };
  var t_ = t;

  /* ── Stage scaling ── */
  function fit() {
    var m = $('.main'), z = 1;
    if (m && innerWidth >= 1081) {
      var cs = getComputedStyle(m);
      var w = m.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      z = Math.max(1, Math.min(w / 1100, m.clientHeight / 764, document.documentElement.hasAttribute('data-x-fs') ? 2.4 : 1.6));
    }
    document.documentElement.style.setProperty('--x-tz', z.toFixed(3));
  }

  /* ── Hand strength ── */
  var RANK = { A: 14, K: 13, Q: 12, J: 11, T: 10 };
  function read(el) {
    var r = $('.cr', el); if (!r) return null;
    var v = r.textContent.trim().toUpperCase(), s = (el.className.match(/suit-(\d)/) || [])[1];
    var n = RANK[v] || parseInt(v, 10);
    return n >= 2 && n <= 14 && s != null ? { r: n, s: +s } : null;
  }
  function straightHigh(ranks) {
    var u = {}; ranks.forEach(function (r) { u[r] = 1; }); if (u[14]) u[1] = 1;
    for (var h = 14; h >= 5; h--) { var ok = true; for (var i = 0; i < 5; i++) if (!u[h - i]) { ok = false; break; } if (ok) return h; }
    return 0;
  }
  function drawOuts(ranks) {      // 2 = open-ended / double gutshot, 1 = gutshot
    var u = {}; ranks.forEach(function (r) { u[r] = 1; }); if (u[14]) u[1] = 1;
    var outs = 0;
    for (var x = 2; x <= 14; x++) { if (u[x]) continue; u[x] = 1; if (x === 14) u[1] = 1;
      var hit = false; for (var h = 14; h >= 5 && !hit; h--) { hit = true; for (var i = 0; i < 5; i++) if (!u[h - i]) { hit = false; break; } }
      if (hit) outs++; delete u[x]; if (x === 14 && ranks.indexOf(14) < 0) delete u[1]; }
    return outs >= 2 ? 2 : outs;
  }
  function evaluate(hole, board) {
    var all = hole.concat(board), cnt = {}, suit = {};
    all.forEach(function (c) { cnt[c.r] = (cnt[c.r] || 0) + 1; (suit[c.s] = suit[c.s] || []).push(c.r); });
    var groups = Object.keys(cnt).map(function (r) { return { r: +r, n: cnt[r] }; })
      .sort(function (a, b) { return b.n - a.n || b.r - a.r; });
    var fs = Object.keys(suit).filter(function (s) { return suit[s].length >= 5; })[0];
    var res = { k: 'hi', strong: false, draw: '' };
    if (!board.length) { if (hole[0].r === hole[1].r) return { k: 'pp', strong: hole[0].r >= 10, draw: '' }; return null; }
    if (fs != null && straightHigh(suit[fs])) res = { k: straightHigh(suit[fs]) === 14 ? 'rf' : 'sf', strong: true };
    else if (groups[0].n === 4) res = { k: 'quads', strong: true };
    else if (groups[0].n === 3 && groups[1] && groups[1].n >= 2) res = { k: 'fh', strong: true };
    else if (fs != null) res = { k: 'fl', strong: true };
    else if (straightHigh(all.map(function (c) { return c.r; }))) res = { k: 'str', strong: true };
    else if (groups[0].n === 3) res = { k: hole[0].r === hole[1].r && hole[0].r === groups[0].r ? 'set' : 'trips', strong: true };
    else if (groups[0].n === 2 && groups[1] && groups[1].n === 2) res = { k: 'two', strong: true };
    else if (groups[0].n === 2) res = { k: hole.some(function (c) { return c.r === groups[0].r; }) ? 'pair' : 'bpair', strong: false };
    res.draw = '';
    if (board.length < 5 && ['hi', 'pair', 'bpair', 'two', 'trips', 'set'].indexOf(res.k) >= 0) {
      var fdraw = Object.keys(suit).some(function (s) {
        return suit[s].length === 4 && hole.some(function (c) { return c.s === +s; }); });
      var so = drawOuts(all.map(function (c) { return c.r; }));
      res.draw = fdraw ? 'fd' : so === 2 ? 'sd' : so === 1 ? 'gs' : '';
    }
    return res;
  }
  function hand() {
    if (!hydrated) return;
    var hole = $('.seat.hero .hole'); if (!hole) return;
    var badge = $('.x-hand', hole);
    var hc = $$('.card', hole).map(read), bc = $$('.board .card').map(read).filter(Boolean);
    var folded = !!$('.seat.hero.folded') || !!$('.hl-win, .hl-lose');   /* at showdown the table shows its own hand label */
    var res = (!folded && hc.length === 2 && hc[0] && hc[1]) ? evaluate(hc, bc) : null;
    if (!res) { if (badge) badge.hidden = true; return; }
    if (!badge) { badge = document.createElement('span'); badge.className = 'x-hand'; hole.appendChild(badge); }
    var d = res.draw ? t(res.draw) : '';
    var html = res.k === 'hi' && d ? '<i>' + d.charAt(0).toUpperCase() + d.slice(1) + '</i>' : t(res.k) + (d ? ' <i>+ ' + d + '</i>' : '');
    if (badge.innerHTML !== html) badge.innerHTML = html;
    badge.classList.toggle('strong', !!res.strong);
    badge.hidden = false;
  }

  /* ── Fold guard: Check is free ── */
  var armed = 0;
  function disarm() { var b = $('.ma-fold[data-x-confirm]'); if (b) { b.removeAttribute('data-x-confirm'); b.removeAttribute('data-x-label'); } clearTimeout(armed); armed = 0; }
  function guard(e) {
    var b = $('.dock.my-turn .ma-fold'); if (!b || !$('.dock.my-turn .ma-call.is-check')) return false;
    if (b.hasAttribute('data-x-confirm')) { disarm(); return false; }
    e.preventDefault(); e.stopImmediatePropagation();
    var sp = $('span', b); if (sp) sp.setAttribute('data-x-label', t('fold'));
    b.setAttribute('data-x-confirm', '');
    armed = setTimeout(disarm, 3000);
    return true;
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.ma-fold')) guard(e); else if (armed) disarm();
  }, true);
  window.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if (e.key === 'Escape') { var x = $('.rp-close'); if (x) x.click(); if (armed) disarm(); return; }
    if (e.key.toLowerCase() === 'f') guard(e);
  }, true);


  /* ── Skin: Neon ── */
  var SKIN_KEY = 'x-skin';
  function skinGet() { try { var v = localStorage.getItem(SKIN_KEY); return v == null ? 'off' : v; } catch (e) { return 'off'; } }  /* classic felt is the default; Neon is opt-in */
  function skinSet(v) { try { localStorage.setItem(SKIN_KEY, v); } catch (e) {} skinApply(); }
  function skinApply() {
    var v = skinGet(), h = document.documentElement;
    if (v === 'neon') h.setAttribute('data-x-skin', 'neon'); else h.removeAttribute('data-x-skin');
    var tile = $('.x-skin-tile');
    if (tile) { tile.classList.toggle('on', v === 'neon'); tile.setAttribute('aria-checked', v === 'neon'); }
  }
  var hydrated = false;
  function isHydrated() {
    if (hydrated) return true;
    var el = $('.table') || $('.app'); if (!el) return false;
    for (var k in el) if (k.indexOf('__reactFiber') === 0 || k.indexOf('__reactProps') === 0) { hydrated = true; break; }
    return hydrated;
  }
  function skinDom() {
    if (!isHydrated()) return;
    if ((skinGet() === 'neon') !== document.documentElement.hasAttribute('data-x-skin')) skinApply();
    var tb = $('.table');
    if (tb && !$('.x-skin-bg', tb)) { var bg = document.createElement('div'); bg.className = 'x-skin-bg'; tb.insertBefore(bg, tb.firstChild); }
    var sw = $('.opt-row .felt-swatch:not(.x-neon)'), row = sw && sw.closest('.opt-row');
    if (row && !$('.x-skin-tile', row)) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'opt-tile x-skin-tile'; b.setAttribute('role', 'radio');
      b.innerHTML = '<span class="felt-swatch x-neon"></span>Neon';
      row.appendChild(b);
      row.addEventListener('click', function (e) {
        var tile = e.target.closest('.opt-tile'); if (!tile) return;
        skinSet(tile.classList.contains('x-skin-tile') ? 'neon' : 'off');
      });
      skinApply();
    }
  }

  /* ── Tab title when it is your turn in a background tab ── */
  var baseTitle = document.title;
  function title() {
    var mine = !!$('.dock.my-turn');
    var want = mine && document.hidden ? '● ' + t('turn') + ' · ' + baseTitle : baseTitle;
    if (document.title !== want) document.title = want;
  }

  /* ── Timer urgency colour ── */
  function timer() {}


  /* ── Deck sits exactly on the middle board slot, same size ── */
  function deck() {
    var d = $('.table > .deck'), tb = $('.table');
    if (tb && !d && tb.hasAttribute('data-x-dealt')) tb.removeAttribute('data-x-dealt');
    if (!d || !tb || d.getAttribute('data-x-fit')) return;
    tb.removeAttribute('data-x-dealt');
    d.addEventListener('animationend', function (e) { if (e.animationName === 'x-deck-out') tb.setAttribute('data-x-dealt', '1'); });
    var slots = $$('.board .board-slot, .board .bcard'); if (slots.length < 3) return;
    var mid = slots[Math.floor(slots.length / 2)], r = mid.getBoundingClientRect(), t = tb.getBoundingClientRect();
    if (!r.width || !t.width) return;
    var z = t.width / tb.offsetWidth || 1;
    d.style.left = ((r.left + r.width / 2 - t.left) / z).toFixed(1) + 'px';
    d.style.top = ((r.top + r.height / 2 - t.top) / z).toFixed(1) + 'px';
    d.style.width = (r.width / z).toFixed(1) + 'px';
    d.setAttribute('data-x-fit', '1');
  }

  /* ── Winner banner: avatar + name + amount chip ── */
  function banner() {
    var el = $('.table > .banner'); if (!el || !hydrated) return;
    var txt = ''; for (var i = 0; i < el.childNodes.length; i++) if (el.childNodes[i].nodeType === 3) txt += el.childNodes[i].textContent;
    txt = txt.trim(); if (el.getAttribute('data-x-src') === txt) return;
    el.setAttribute('data-x-src', txt);
    var oldEl = $('.x-win', el); if (oldEl) oldEl.remove();
    var m = txt.match(/^(.+?)\s+(wins?|won|виграє|виграєте|виграв|виграли|забирає)\s+(.+)$/i);
    if (!m) { el.removeAttribute('data-x-win'); return; }
    var name = m[1], rest = m[3].replace(/^\+/, ''), src = '';
    var am = rest.match(/^(\S+)[,\s]*(.*)$/), amt = am ? am[1].replace(/,$/, '') : rest, note = am ? am[2] : '';
    $$('.seat').forEach(function (st) { var nm = $('.nm', st); if (nm && nm.textContent.trim() === name) { var im = $('.ava-img', st); if (im) src = im.currentSrc || im.src; } });
    var w = document.createElement('span'); w.className = 'x-win';
    if (src) { var im2 = document.createElement('img'); im2.className = 'x-win-ava'; im2.alt = ''; im2.src = src; w.appendChild(im2); }
    var n = document.createElement('span'); n.className = 'x-win-name'; n.textContent = name; w.appendChild(n);
    if (note) { var nt = document.createElement('span'); nt.className = 'x-win-note'; nt.textContent = note; w.appendChild(nt); }
    var a = document.createElement('span'); a.className = 'x-win-amt'; a.textContent = '+' + amt; w.appendChild(a);
    el.appendChild(w); el.setAttribute('data-x-win', src ? 'ava' : 'text');
  }

  /* ── Full screen toggle ── */
  function fsDom() {
    var root = document.documentElement, can = document.fullscreenEnabled || document.webkitFullscreenEnabled;
    if (!can || !$('.table') || $('.x-fs')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'x-fs';
    var ICON = { on: '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4"/></svg>',
                 off: '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v4H3M17 7h-4V3M13 17v-4h4M3 13h4v4"/></svg>' };
    var isFs = function () { return !!(document.fullscreenElement || document.webkitFullscreenElement); };
    var paint = function () { var f = isFs(); b.innerHTML = f ? ICON.off : ICON.on; b.setAttribute('aria-label', f ? 'Exit full screen' : 'Full screen'); b.title = b.getAttribute('aria-label'); root.toggleAttribute('data-x-fs', f); setTimeout(fit, 60); setTimeout(fit, 400); };
    b.addEventListener('click', function () {
      if (isFs()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else { var r = (root.requestFullscreen || root.webkitRequestFullscreen).call(root); if (r && r.catch) r.catch(function () {}); }
    });
    document.addEventListener('fullscreenchange', paint); document.addEventListener('webkitfullscreenchange', paint);
    document.body.appendChild(b); paint();
  }

  /* ── Turn clock: own progress value (the build's ring ran out at half time) ── */
  var turnKey = null, turnStart = 0, turnDur = 15000, turnT = 1, turnEl = 0;
  function clockFrame() {
    var seat = document.querySelector('.seat.turn'), rw = seat && seat.querySelector('.ring-wrap');
    if (rw) {
      var cs = getComputedStyle(rw), dur = parseFloat(cs.getPropertyValue('--dur')) || 15000, el = parseFloat(cs.getPropertyValue('--elapsed')) || 0;
      var key = seat.className.replace(/\s*\bturn\b\s*/g, ' ').trim();
      if (key !== turnKey || el > turnEl + 500) { turnKey = key; turnDur = dur; turnStart = performance.now() + el; }
      turnEl = el;
      turnT = Math.max(0, Math.min(1, 1 - (performance.now() - turnStart) / turnDur));
      rw.style.setProperty('--x-t', turnT.toFixed(4));
      var lv = turnT * turnDur <= 3000 ? 'low' : turnT * turnDur <= 7000 ? 'mid' : '';
      if (lv) { if (seat.getAttribute('data-x-t') !== lv) seat.setAttribute('data-x-t', lv); } else if (seat.hasAttribute('data-x-t')) seat.removeAttribute('data-x-t');
    } else turnKey = null;
    requestAnimationFrame(clockFrame);
  }
  requestAnimationFrame(clockFrame);

  /* ── "To act" status: ring with seconds + name (Figma "To act 05") ── */
  var ACT_R = 10.4, ACT_C = 2 * Math.PI * ACT_R;
  function act() {
    var st = $('.dock-status'); if (!st || !hydrated) return;
    var seat = $('.seat.turn'), b = $('b', st), mine = !!$('.dock.my-turn') || !!$('.turn-dot', st);
    if (!seat || !b) { if (st.hasAttribute('data-x-act')) { st.removeAttribute('data-x-act'); var o = $('.x-act', st); if (o) o.remove(); } return; }
    var t = turnKey ? turnT : 1, secs = Math.ceil(t * turnDur / 1000);
    var name = mine ? t_('turn') : b.textContent.trim();
    var x = $('.x-act', st);
    if (!x) { x = document.createElement('span'); x.className = 'x-act';
      x.innerHTML = '<span class="x-act-ring"><svg viewBox="0 0 26 26" width="26" height="26"><circle class="x-act-track" cx="13" cy="13" r="' + ACT_R + '"/><circle class="x-act-prog" cx="13" cy="13" r="' + ACT_R + '" transform="rotate(-90 13 13)"/></svg><i></i></span><span class="x-act-name"></span><span class="x-act-note"></span>';
      st.appendChild(x); }
    var lvl = secs <= 3 ? 'low' : secs <= 7 ? 'mid' : '';
    if (x.getAttribute('data-l') !== lvl) x.setAttribute('data-l', lvl);
    var prog = $('.x-act-prog', x); prog.setAttribute('stroke-dasharray', (Math.max(0, Math.min(1, t)) * ACT_C).toFixed(2) + ' ' + ACT_C.toFixed(2));
    var n = $('i', x); if (n.textContent !== String(secs)) n.textContent = secs;
    var nm = $('.x-act-name', x); if (nm.textContent !== name) nm.textContent = name;
    var note = mine ? '' : t_('toact'), ne = $('.x-act-note', x); if (ne.textContent !== note) ne.textContent = note;
    if (!st.hasAttribute('data-x-act')) st.setAttribute('data-x-act', '');
  }
  setInterval(function () { if (document.querySelector('.seat.turn')) act(); }, 100);

  var raf = 0;
  function tick() { raf = 0; skinDom(); fsDom(); deck(); banner(); hand(); timer(); act(); title(); if (armed && !$('.dock.my-turn')) disarm();
    if (document.body && !document.body.hasAttribute('data-x-rotate')) document.body.setAttribute('data-x-rotate', t('rotate')); }
  function queue() { if (!raf) raf = requestAnimationFrame(tick); }
  function start() {
    fit(); queue();
    var hy = setInterval(function () { if (isHydrated()) { clearInterval(hy); queue(); } }, 60);
    new MutationObserver(function () { queue(); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'], characterData: true });
    new ResizeObserver(fit).observe(document.documentElement);
    var m = $('.main'); if (m) new ResizeObserver(fit).observe(m);
    document.addEventListener('visibilitychange', title);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.addEventListener('load', function () { fit(); setTimeout(fit, 600); });
})();
