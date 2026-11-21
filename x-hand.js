/* Hand strength badge under the hero's cards (made hand + draws). */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var uk = function () { var d = $('.dock'); return !!d && /[Ѐ-ӿ]/.test(d.textContent); };
  var T = {
    en: { hi: 'High card', pair: 'Pair', bpair: 'Pair on board', pp: 'Pocket pair', two: 'Two pair', trips: 'Trips', set: 'Set',
      str: 'Straight', fl: 'Flush', fh: 'Full house', quads: 'Four of a kind', sf: 'Straight flush', rf: 'Royal flush',
      fd: 'flush draw', sd: 'straight draw', gs: 'gutshot', fold: 'Check is free\nFold anyway?', turn: 'Your turn',
      rotate: 'Rotate your phone to play' },
    uk: { hi: 'Старша карта', pair: 'Пара', bpair: 'Пара на борді', pp: 'Кишенькова пара', two: 'Дві пари', trips: 'Трійка', set: 'Сет',
      str: 'Стріт', fl: 'Флеш', fh: 'Фул-хаус', quads: 'Каре', sf: 'Стріт-флеш', rf: 'Роял-флеш',
      fd: 'флеш-дро', sd: 'стріт-дро', gs: 'гатшот', fold: 'Чек безкоштовний\nВсе одно фолд?', turn: 'Ваш хід',
      rotate: 'Поверніть телефон вертикально' }
  };
  var t = function (k) { return (uk() ? T.uk : T.en)[k]; };
  var hydrated = false;
  function isHydrated() {
    if (hydrated) return true;
    var el = $('.table') || $('.app'); if (!el) return false;
    for (var k in el) if (k.indexOf('__reactFiber') === 0 || k.indexOf('__reactProps') === 0) { hydrated = true; break; }
    return hydrated;
  }
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

  var css = '.x-hand{position:absolute;left:50%;top:calc(100% + 4px);translate:-50% 0;z-index:6;display:flex;align-items:center;gap:6px;' +
    'padding:4px 10px;border-radius:99px;white-space:nowrap;background:rgba(6,16,30,.9);color:#F3F7FC;font:700 12px/1.2 Montserrat,system-ui,sans-serif;' +
    'box-shadow:0 4px 12px rgba(0,0,0,.4);pointer-events:none;-webkit-user-select:none;user-select:none}' +
    '.x-hand[hidden]{display:none}.x-hand i{font-style:normal;font-weight:600;color:#E9C987}' +
    '.x-hand.strong{background:rgba(60,46,14,.94);color:#F4DDA6}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var raf = 0;
  function tick() { raf = 0; if (isHydrated()) hand(); }
  function queue() { if (!raf) raf = requestAnimationFrame(tick); }
  function start() {
    new MutationObserver(queue).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    var hy = setInterval(function () { if (isHydrated()) { clearInterval(hy); queue(); } }, 60);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
