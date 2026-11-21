
/* ── Custom emoji set (brand/emoji/*.svg) instead of platform emoji:
   tags reaction buttons, projectiles, bursts and chat quick-replies with data-emo so CSS can swap in the artwork. */
(function () {
  var MAP = { '❤️': 'heart', '❤': 'heart', '🔥': 'fire', '👍': 'thumb', '😂': 'joy',
    '😱': 'scream', '🤡': 'clown', '💩': 'poo', '🐟': 'fish',
    '🍅': 'tomato', '🏏': 'club', '🪓': 'axe', '😤': 'steam' };
  function tag(el) {
    if (el.nodeType !== 1 || el.hasAttribute('data-emo')) return;
    var txt = (el.childNodes.length && el.childNodes[0].nodeType === 3 ? el.childNodes[0].nodeValue : el.textContent).trim();
    var k = MAP[txt] || MAP[txt.replace(/️/g, '')];
    if (k) el.setAttribute('data-emo', k);
  }
  var SEL = '.emopop .emo-row button, .emopop .item, .fly, .rx-big, .rx-p, .chat-quick button';
  function scan(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches && root.matches(SEL)) tag(root);
    var list = root.querySelectorAll ? root.querySelectorAll(SEL) : [];
    for (var i = 0; i < list.length; i++) tag(list[i]);
  }
  function start() {
    scan(document.body);
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) for (var j = 0; j < muts[i].addedNodes.length; j++) scan(muts[i].addedNodes[j]);
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
