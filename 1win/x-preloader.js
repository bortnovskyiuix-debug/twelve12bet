/* Preloader: the mark fills with light from the bottom up (soft edge), like the banner load.
   Phones only inside Telegram; desktop Telegram skips it. Fades out as soon as the table is ready. */
(function () {
  if (window.__xPre) return; window.__xPre = 1;
  var d = document, root = d.documentElement;
  try {
    var inTg = /tgWebApp(Data|Version|Platform)=/.test(location.hash + location.search) || !!window.TelegramWebviewProxy ||
      !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) || !!sessionStorage.getItem('__telegram__initParams');
    if (inTg && window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  } catch (e) {}
  var SP = 'M50 6C50 6 12 38 12 60C12 73 22 82 33 82C39 82 44 80 47 76C46 84 42 90 36 94H64C58 90 54 84 53 76C56 80 61 82 67 82C78 82 88 73 88 60C88 38 50 6 50 6Z';
  var mark = function (cls) {
    return '<div class="x-pre-mark ' + cls + '"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="' + SP + '"/></svg><b>POKER</b></div>';
  };
  var css =
    '.x-pre{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;overflow:hidden;' +
      'background:radial-gradient(120% 70% at 50% 108%,#0B3FA8 0,#071A4A 38%,#03081C 72%,#02040E 100%);transition:opacity .55s ease,visibility .55s ease}' +
    '.x-pre.out{opacity:0;visibility:hidden}' +
    '.x-pre-stack{position:relative;display:grid}' +
    '.x-pre-mark{grid-area:1/1;display:flex;flex-direction:column;align-items:center;gap:14px;color:#fff;' +
      'font-family:var(--font-display,Montserrat),Montserrat,system-ui,sans-serif}' +
    '.x-pre-mark svg{width:min(26vw,120px);height:auto;fill:currentColor}' +
    '.x-pre-mark b{font-weight:800;font-size:min(8.4vw,38px);letter-spacing:.2em;margin-right:-.2em;line-height:1}' +
    '.x-pre-mark.dim{color:#1C2F66}' +
    '.x-pre-mark.lit{color:#fff;' +
      '-webkit-mask-image:linear-gradient(to top,#000 calc(var(--p)*128% - 28%),transparent calc(var(--p)*128%));' +
      'mask-image:linear-gradient(to top,#000 calc(var(--p)*128% - 28%),transparent calc(var(--p)*128%))}' +
    '.x-pre-mark.lit svg{fill:#2E8BFF}';
  var st = d.createElement('style'); st.textContent = css; (d.head || root).appendChild(st);
  var el = d.createElement('div'); el.className = 'x-pre'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="x-pre-stack" style="--p:0">' + mark('dim') + mark('lit') + '</div>';
  var stack = el.firstChild;
  var mount = function () { if (!el.isConnected && !el.classList.contains('gone')) (d.body || root).appendChild(el); };
  if (d.body) mount(); else d.addEventListener('DOMContentLoaded', mount);
  /* the app re-renders the page while it boots; put the overlay back if it gets wiped */
  var keep = setInterval(function () { if (el.classList.contains('gone')) return clearInterval(keep); mount(); }, 30);
  var reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var t0 = performance.now(), FILL = reduce ? 1 : 2200, MAX = 9000, p = 0, target = .86, done = false;
  function ready() { return !!d.querySelector('.table .seat') && d.readyState === 'complete'; }
  function ease(x) { return x * x * x * (x * (6 * x - 15) + 10); }
  function frame(now) {
    if (el.classList.contains('gone')) return;
    var t = now - t0;
    if (ready() || t > MAX) target = 1;
    /* the fill glides to 86% on its own, and to the top only when the table is really there */
    var want = Math.min(target, ease(Math.min(1, t / FILL)) * .86 + (target === 1 ? .14 : 0));
    p += (want - p) * .12; if (want - p < .002) p = want;
    stack.style.setProperty('--p', p.toFixed(4));
    if (p >= .999 && !done) {
      done = true;
      setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.classList.add('gone'); el.remove(); }, 650); }, 260);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
