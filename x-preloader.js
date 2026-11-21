/* Preloader in the style of the welcome banner: dark stage, blue glow from below,
   rising sparks, corner captions, logo fades in from dim to lit. Site logo only. */
(function () {
  if (window.__xPre) return; window.__xPre = 1;
  var d = document, root = d.documentElement;
  var css = '' +
    '.x-pre{position:fixed;inset:0;z-index:2147483000;background:#000;overflow:hidden;display:grid;place-items:center;' +
      'font-family:Montserrat,system-ui,sans-serif;transition:opacity .6s ease,visibility .6s ease}' +
    '.x-pre.out{opacity:0;visibility:hidden}' +
    '.x-pre::before{content:"";position:absolute;left:0;right:0;bottom:0;height:42%;' +
      'background:linear-gradient(180deg,rgba(0,0,0,0),rgba(9,45,86,.75) 55%,#1E5A93);pointer-events:none}' +
    '.x-pre-logo{position:relative;z-index:2;width:min(46vw,300px);height:auto;opacity:.18;filter:saturate(.6) brightness(.7);' +
      'animation:x-pre-lit 1.3s cubic-bezier(.16,1,.3,1) .35s forwards}' +
    '@keyframes x-pre-lit{60%{opacity:1;filter:drop-shadow(0 0 22px rgba(80,170,255,.9)) brightness(1.35)}' +
      'to{opacity:1;filter:drop-shadow(0 0 14px rgba(40,140,255,.55)) brightness(1)}}' +
    '.x-pre-cap{position:absolute;z-index:3;font-size:11px;font-weight:600;letter-spacing:.04em;color:rgba(255,255,255,.85);' +
      'opacity:0;animation:x-pre-cap .6s ease forwards;white-space:nowrap}' +
    '@keyframes x-pre-cap{to{opacity:1}}' +
    '.x-pre-cap.t{top:22px}.x-pre-cap.b{bottom:22px}.x-pre-cap.m{top:50%;translate:0 -50%}' +
    '.x-pre-cap.l{left:24px}.x-pre-cap.r{right:24px}.x-pre-cap.c{left:50%;translate:-50% 0}' +
    '.x-pre-spark{position:absolute;bottom:-6px;width:2px;border-radius:2px;background:linear-gradient(180deg,rgba(140,200,255,0),rgba(140,200,255,.9));' +
      'animation:x-pre-up linear infinite;opacity:.0}' +
    '@keyframes x-pre-up{10%{opacity:.9}to{transform:translateY(-62vh);opacity:0}}' +
    '.x-pre-bar{position:absolute;z-index:3;left:50%;bottom:64px;width:min(38vw,220px);height:2px;translate:-50% 0;border-radius:2px;background:rgba(255,255,255,.12);overflow:hidden}' +
    '.x-pre-bar i{position:absolute;inset:0;transform-origin:left;transform:scaleX(0);background:#2AA6FF;transition:transform .35s ease}' +
    '@media (max-width:700px){.x-pre-cap{font-size:9.5px}.x-pre-cap.l{left:14px}.x-pre-cap.r{right:14px}.x-pre-cap.m{display:none}}' +
    '@media (prefers-reduced-motion:reduce){.x-pre-logo{animation-duration:.01s;animation-delay:0s}.x-pre-spark{display:none}}';
  var st = d.createElement('style'); st.textContent = css; (d.head || root).appendChild(st);
  var base = (function () { var cs = d.currentScript && d.currentScript.src; return cs ? cs.replace(/[^\/]*$/, '') : '/'; })();
  css += '.x-pre-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;background:#000}' +
         '.x-pre.vid::before,.x-pre.vid .x-pre-logo,.x-pre.vid .x-pre-spark{display:none}' +
         '@media (max-aspect-ratio:4/5){.x-pre.vid{background:linear-gradient(180deg,#000 0,#000 calc(50% + 20vw),#045182 calc(50% + 58vw),#02304f 100%)}' +
           '.x-pre-vid{inset:auto;left:-22vw;width:144vw;top:calc(50% - 46vw);height:90vw;object-fit:fill;' +
           '-webkit-mask:linear-gradient(180deg,#000 60%,transparent 82%);mask:linear-gradient(180deg,#000 60%,transparent 82%)}}';
  st.textContent = css;
  var el = d.createElement('div'); el.className = 'x-pre vid'; el.setAttribute('aria-hidden', 'true');
  var caps = [['t l', 'POKER ROOM', .5], ['t c', 'NLH · PLO · SPIN & GO', .62], ['t r', '2026', .74],
              ['m l', 'V1.0', .86], ['m r', 'DEMO', .92]];
  var html = '<video class="x-pre-vid" src="' + base + 'brand/1xbet/preloader.mp4" autoplay muted playsinline disablepictureinpicture></video>' +
             '<img class="x-pre-logo" src="' + base + 'brand/12bet/logo.svg" alt="">';
  caps.forEach(function (c) { html += '<span class="x-pre-cap ' + c[0] + '" style="animation-delay:' + c[2] + 's">' + c[1] + '</span>'; });
  for (var i = 0; i < 26; i++) {
    var h = 6 + Math.random() * 14, dur = 2.6 + Math.random() * 3.2;
    html += '<i class="x-pre-spark" style="left:' + (Math.random() * 100).toFixed(1) + '%;height:' + h.toFixed(0) + 'px;animation-duration:' + dur.toFixed(2) + 's;animation-delay:' + (-Math.random() * dur).toFixed(2) + 's"></i>';
  }
  html += '<span class="x-pre-bar"><i></i></span>';
  el.innerHTML = html;
  var mount = function () { if (!el.isConnected && !el.classList.contains('gone')) (d.body || root).appendChild(el); };
  if (d.body) mount(); else d.addEventListener('DOMContentLoaded', mount);
  /* the app re-renders the page while it boots; put the overlay back if it gets wiped */
  var keep = setInterval(function () { if (el.classList.contains('gone')) return clearInterval(keep); mount(); }, 30);
  var bar = function (v) { var b = el.querySelector('.x-pre-bar i'); if (b) b.style.transform = 'scaleX(' + v + ')'; };
  var t0 = Date.now(), MIN = 1900, MAX = 6000, done = false;
  var p = 0, tick = setInterval(function () { p = Math.min(.9, p + .06); bar(p); }, 120);
  function ready() { return !!d.querySelector('.table .seat') || !!d.querySelector('.lobby, main'); }
  function finish() {
    if (done) return; done = true; clearInterval(tick); bar(1);
    setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.classList.add('gone'); el.remove(); }, 700); }, Math.max(0, MIN - (Date.now() - t0)) + 200);
  }
  /* the fill animation must play through once: finish only when the video ends (or can't play at all) */
  var vid = el.querySelector('.x-pre-vid'), vidDone = false, vidDead = false;
  if (vid) {
    vid.addEventListener('ended', function () { vidDone = true; });
    vid.addEventListener('error', function () { vidDead = true; });
    vid.addEventListener('timeupdate', function () { var dd = vid.duration; if (dd && vid.currentTime >= dd - .05) vidDone = true; bar(Math.max(p, dd ? vid.currentTime / dd * .95 : 0)); });
    /* the app re-renders the page on boot, which can yank the overlay (and pause the video): keep nudging play */
    var kick = function () { if (vidDone || vidDead || !vid.paused) return; var pr = vid.play && vid.play(); if (pr && pr.catch) pr.catch(function () {}); };
    kick(); var kicker = setInterval(function () { if (vidDone || vidDead || done) return clearInterval(kicker); kick(); }, 250);
    MAX = 10000;
  }
  var vidOk = function () { return !vid || vidDone || vidDead; };
  var poll = setInterval(function () { if ((ready() && d.readyState === 'complete' && vidOk()) || Date.now() - t0 > MAX) { clearInterval(poll); finish(); } }, 100);
})();
