/* Telegram Mini App shell: real full screen, no swipe-to-close, safe areas.
   Runs before the app bundle so the first frame is already laid out for Telegram.
   Works when the page is opened as play.html#tgWebAppData=… (index.html keeps the hash). */
(function () {
  var d = document.documentElement;
  var inTg = /tgWebApp(Data|Version|Platform)=/.test(location.hash + location.search) ||
    !!(window.TelegramWebviewProxy || (window.external && 'notify' in window.external)) ||
    (function () { try { return !!sessionStorage.getItem('__telegram__initParams'); } catch (e) { return false; } })();

  function vars(w) {
    var s = w.safeAreaInset || {}, c = w.contentSafeAreaInset || {};
    d.style.setProperty('--tg-top', ((s.top || 0) + (c.top || 0)) + 'px');
    d.style.setProperty('--tg-bottom', ((s.bottom || 0) + (c.bottom || 0)) + 'px');
    if (w.viewportStableHeight) d.style.setProperty('--tg-h', w.viewportStableHeight + 'px');
    d.toggleAttribute('data-tg-fs', !!w.isFullscreen);
  }

  function call(w, fn, minVer) {
    if (typeof w[fn] !== 'function') return;
    if (minVer && w.isVersionAtLeast && !w.isVersionAtLeast(minVer)) return;
    try { w[fn](); } catch (e) {}
  }

  function init(w) {
    if (!w || init.done) return;
    init.done = true;
    d.classList.add('tg');
    call(w, 'ready');
    call(w, 'expand');
    try { w.setHeaderColor('#000F1A'); w.setBackgroundColor('#000F1A'); } catch (e) {}
    call(w, 'disableVerticalSwipes', '7.7');
    var mobile = /ios|android/.test(w.platform || '');
    var fs = function () { if (mobile && !w.isFullscreen) call(w, 'requestFullscreen', '8.0'); };
    fs();
    /* Telegram can refuse while the sheet animates: retry a few times until it sticks */
    var tries = 0, again = setInterval(function () { if (w.isFullscreen || ++tries > 8) return clearInterval(again); fs(); }, 400);
    try { w.onEvent('fullscreenFailed', function () { setTimeout(fs, 500); }); } catch (e) {}
    call(w, 'lockOrientation', '8.0');
    vars(w);
    var upd = function () { vars(w); };
    ['viewportChanged', 'safeAreaChanged', 'contentSafeAreaChanged', 'fullscreenChanged'].forEach(function (ev) {
      try { w.onEvent(ev, upd); } catch (e) {}
    });
    // Telegram can refuse full screen while the sheet is still opening: try again once it settles.
    try { w.onEvent('activated', fs); } catch (e) {}
    setTimeout(fs, 600);
  }

  function boot() {
    var w = window.Telegram && window.Telegram.WebApp;
    if (w && (w.initData || w.platform !== 'unknown')) return init(w);
    if (!inTg) return;
    if (w) return init(w);
    var s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-web-app.js';
    s.onload = function () { init(window.Telegram && window.Telegram.WebApp); };
    document.head.appendChild(s);
  }
  boot();

  /* No image/card dragging and no text selection on long-press (inputs stay editable). */
  var editable = function (t) { return t && t.closest && t.closest('input, textarea, [contenteditable]'); };
  document.addEventListener('dragstart', function (e) { if (!editable(e.target)) e.preventDefault(); }, true);
  document.addEventListener('selectstart', function (e) { if (!editable(e.target)) e.preventDefault(); }, true);
  document.addEventListener('contextmenu', function (e) { if (inTg && !editable(e.target)) e.preventDefault(); }, true);
})();

/* Web: go full screen on the first tap or click (browsers do not allow it without one). */
(function () {
  var inTg = document.documentElement.classList.contains('tg') || /tgWebApp/.test(location.hash + location.search);
  if (inTg) return;
  var root = document.documentElement;
  var req = root.requestFullscreen || root.webkitRequestFullscreen;
  if (!req || !(document.fullscreenEnabled || document.webkitFullscreenEnabled)) return;
  var go = function () {
    window.removeEventListener('pointerdown', go, true); window.removeEventListener('keydown', go, true);
    if (document.fullscreenElement || document.webkitFullscreenElement) return;
    try { var r = req.call(root); if (r && r.catch) r.catch(function () {}); } catch (e) {}
  };
  window.addEventListener('pointerdown', go, true); window.addEventListener('keydown', go, true);
})();
