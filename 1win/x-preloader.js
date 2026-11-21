/* 1win POKER preloader: the final vector artwork includes the logo and a pattern that fills from the bottom.
   Stays until the fill has reached the top and the table is ready, then fades out.
   Skipped inside Telegram on desktop. */
(function () {
  if (window.__xPre) return; window.__xPre = 1;
  var d = document, root = d.documentElement;
  try {
    var inTg = /tgWebApp(Data|Version|Platform)=/.test(location.hash + location.search) || !!window.TelegramWebviewProxy ||
      !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) || !!sessionStorage.getItem('__telegram__initParams');
    if (inTg && window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  } catch (e) {}
  var base = (function () { var cs = d.currentScript && d.currentScript.src; return cs ? cs.replace(/[^\/]*$/, '') : './'; })();
  var css =
    '.x-pre{position:fixed;inset:0;z-index:2147483000;background:#070d14;overflow:hidden;transition:opacity .5s ease,visibility .5s ease}' +
    '.x-pre.out{opacity:0;visibility:hidden}' +
    '.x-pre-art{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover}';
  var st = d.createElement('style'); st.textContent = css; (d.head || root).appendChild(st);
  var el = d.createElement('div'); el.className = 'x-pre'; el.setAttribute('role', 'status'); el.setAttribute('aria-label', 'Loading 1win POKER');
  el.innerHTML = '<img class="x-pre-art" alt="" src="' + base + 'brand/preloader-vertical.svg?v=2">';
  var mount = function () { if (!el.isConnected && !el.classList.contains('gone')) (d.body || root).appendChild(el); };
  if (d.body) mount(); else d.addEventListener('DOMContentLoaded', mount);
  /* the app re-renders the page while it boots; put the overlay back if it gets wiped */
  var keep = setInterval(function () { if (el.classList.contains('gone')) return clearInterval(keep); mount(); }, 30);
  var img = el.firstChild, t0 = Date.now(), tArt = 0, FILL = 3800, MAX = 9000, done = false;
  var reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  img.addEventListener('load', function () { tArt = Date.now(); });
  img.addEventListener('error', function () { tArt = -1; });
  function ready() { return !!d.querySelector('.table .seat') && d.readyState === 'complete'; }
  function filled() { return reduce || tArt < 0 || (tArt > 0 && Date.now() - tArt >= FILL); }   /* the SVG fill reaches the top at 74% of 5 s */
  var poll = setInterval(function () {
    if (done || !((ready() && filled()) || Date.now() - t0 > MAX)) return;
    done = true; clearInterval(poll);
    el.classList.add('out'); setTimeout(function () { el.classList.add('gone'); el.remove(); }, 600);
  }, 80);
})();
