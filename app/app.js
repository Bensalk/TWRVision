// TWRVision v0.2.0 — ES5 IIFE — Chromium 53 / webOS 4.x compatible
(function () {
  'use strict';

  var VERSION = '0.4.30';

  // ── PIN Lock ──────────────────────────────────────────────────────────────
  var PIN_DEFAULT = '8907';
  var PIN_CORRECT = (function () { try { var v = localStorage.getItem('hv_pin'); return v || PIN_DEFAULT; } catch(e) { return PIN_DEFAULT; } })();
  var pinEntry = '';
  var pinCallback = null;
  var pinDismissTimer = null;
  var pinUnlocked = false;

  function updatePinDots() {
    for (var i = 0; i < 4; i++) {
      var dot = document.getElementById('pd' + i);
      if (dot) dot.className = 'pin-dot' + (i < pinEntry.length ? ' filled' : '');
    }
  }

  function showPinMsg(msg) {
    var el = document.getElementById('pin-msg');
    if (el) el.textContent = msg;
  }

  function closePinOverlay() {
    clearTimeout(pinDismissTimer);
    pinEntry = '';
    pinCallback = null;
    updatePinDots();
    showPinMsg('');
    var ov = document.getElementById('pin-overlay');
    if (ov) ov.classList.add('hidden');
  }

  function openPinOverlay(onSuccess) {
    pinEntry = '';
    pinCallback = onSuccess;
    updatePinDots();
    showPinMsg('');
    var ov = document.getElementById('pin-overlay');
    if (ov) ov.classList.remove('hidden');
    var backBtn2 = document.getElementById('pin-back');
    if (backBtn2) setTimeout(function () { setFocus(backBtn2); }, 60);
  }

  function handlePinKey(k) {
    if (pinEntry.length >= 4) return;
    pinEntry += k;
    updatePinDots();
    if (pinEntry.length === 4) {
      if (pinEntry === PIN_CORRECT) {
        var cb = pinCallback;
        closePinOverlay();
        if (cb) cb();
      } else {
        showPinMsg('Wrong PIN. Try again.');
        var dots = document.querySelectorAll('.pin-dot');
        for (var di = 0; di < dots.length; di++) { dots[di].className = 'pin-dot pin-wrong'; }
        pinDismissTimer = setTimeout(function () {
          pinEntry = '';
          updatePinDots();
          showPinMsg('');
        }, 1500);
      }
    }
  }

  function initPinKeypad() {
    var keys = document.querySelectorAll('.pin-key[data-k]');
    for (var i = 0; i < keys.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () { handlePinKey(btn.getAttribute('data-k')); });
      })(keys[i]);
    }
    var clearBtn = document.getElementById('pin-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        pinEntry = pinEntry.slice(0, -1);
        updatePinDots();
        showPinMsg('');
      });
    }
    var cancelBtn = document.getElementById('pin-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () { closePinOverlay(); });
    }
    var backBtn = document.getElementById('pin-back');
    if (backBtn) {
      backBtn.addEventListener('click', function () { closePinOverlay(); });
    }
  }

  // ── Change PIN flow ───────────────────────────────────────────────────────
  var changePinStep = 0; // 0=idle, 1=enter current, 2=enter new, 3=confirm new
  var changePinNew = '';

  function startChangePinFlow() {
    changePinStep = 1;
    changePinNew = '';
    openPinOverlay(function () {
      // Step 1 passed (current PIN correct) — now ask for new PIN
      changePinStep = 2;
      openChangePinStep2();
    });
    var title = document.getElementById('pin-title');
    if (title) title.textContent = 'Enter Current PIN';
  }

  function openChangePinStep2() {
    pinEntry = '';
    updatePinDots();
    showPinMsg('');
    var ov = document.getElementById('pin-overlay');
    if (ov) ov.classList.remove('hidden');
    var title = document.getElementById('pin-title');
    if (title) title.textContent = 'Enter New PIN';
    var backBtn2 = document.getElementById('pin-back');
    if (backBtn2) setTimeout(function () { setFocus(backBtn2); }, 60);
    // Override pinCallback for step 2
    pinCallback = function () {
      changePinNew = pinEntry;
      // Step 3: confirm new PIN
      changePinStep = 3;
      pinEntry = '';
      updatePinDots();
      showPinMsg('');
      var ov2 = document.getElementById('pin-overlay');
      if (ov2) ov2.classList.remove('hidden');
      var title2 = document.getElementById('pin-title');
      if (title2) title2.textContent = 'Confirm New PIN';
      var backBtn3 = document.getElementById('pin-back');
      if (backBtn3) setTimeout(function () { setFocus(backBtn3); }, 60);
      pinCallback = function () {
        // Confirmed — save new PIN
        try { localStorage.setItem('hv_pin', changePinNew); } catch(e) {}
        PIN_CORRECT = changePinNew;
        changePinStep = 0;
        changePinNew = '';
        closePinOverlay();
        var title3 = document.getElementById('pin-title');
        if (title3) title3.textContent = 'Enter PIN';
        showToast('PIN changed successfully');
      };
      // Reuse handlePinKey but check against changePinNew
      pinChangingConfirm = true;
    };
    pinChangingNew = true;
  }

  var pinChangingNew = false;
  var pinChangingConfirm = false;

  // Wrap handlePinKey to support Change PIN steps
  var _origHandlePinKey = handlePinKey;
  handlePinKey = function (k) {
    if (changePinStep === 2 && pinChangingNew) {
      if (pinEntry.length >= 4) return;
      pinEntry += k;
      updatePinDots();
      if (pinEntry.length === 4) {
        pinChangingNew = false;
        var cb = pinCallback;
        closePinOverlayKeepTitle();
        if (cb) cb();
      }
      return;
    }
    if (changePinStep === 3 && pinChangingConfirm) {
      if (pinEntry.length >= 4) return;
      pinEntry += k;
      updatePinDots();
      if (pinEntry.length === 4) {
        if (pinEntry === changePinNew) {
          pinChangingConfirm = false;
          var cb2 = pinCallback;
          closePinOverlay();
          if (cb2) cb2();
        } else {
          showPinMsg('PINs do not match. Try again.');
          var dots = document.querySelectorAll('.pin-dot');
          for (var di = 0; di < dots.length; di++) { dots[di].className = 'pin-dot pin-wrong'; }
          pinDismissTimer = setTimeout(function () {
            pinEntry = '';
            updatePinDots();
            showPinMsg('');
          }, 1500);
        }
      }
      return;
    }
    _origHandlePinKey(k);
  };

  function closePinOverlayKeepTitle() {
    clearTimeout(pinDismissTimer);
    pinEntry = '';
    updatePinDots();
    showPinMsg('');
    var ov = document.getElementById('pin-overlay');
    if (ov) ov.classList.add('hidden');
  }

  function showToast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.remove('hidden');
    t.classList.add('toast-show');
    setTimeout(function () {
      t.classList.remove('toast-show');
      t.classList.add('hidden');
    }, 2500);
  }

  // ── Themes ─────────────────────────────────────────────────────────────
  var THEMES = [
    { name: 'Midnight', bg: '#0B0D14', surface: '#151826', accent: '#7C5CFF', glow: '#1A1440' },
    { name: 'AMOLED',   bg: '#000000', surface: '#111111', accent: '#FFFFFF', glow: '#000000' },
    { name: 'Neon',     bg: '#07060F', surface: '#140F2A', accent: '#00F0FF', glow: '#2A0F3A' },
    { name: 'Sunset',   bg: '#1A0B12', surface: '#2A1420', accent: '#FF7A45', glow: '#4A1D2E' },
    { name: 'Ocean',    bg: '#06121C', surface: '#0D2233', accent: '#2EA8FF', glow: '#0B3A57' },
    { name: 'Forest',   bg: '#07130D', surface: '#0F2318', accent: '#3DDC84', glow: '#123B26' },
    { name: 'Crimson',  bg: '#140608', surface: '#241014', accent: '#FF3B5C', glow: '#3A0F18' },
    { name: 'Gold',     bg: '#120F05', surface: '#211B0B', accent: '#FFC53D', glow: '#3A2D0A' },
    { name: 'Mint',     bg: '#06120F', surface: '#0D211C', accent: '#5CF2C8', glow: '#0F3A30' },
    { name: 'Slate',    bg: '#0E1116', surface: '#1A1F27', accent: '#9AA7B8', glow: '#232A35' }
  ];

  // ── IPTV-org library ────────────────────────────────────────────────────
  var BASE = 'https://iptv-org.github.io/iptv/';
  var LIBRARY = [
    // ── Indian Channels (by language) ──────────────────────────────────────
    { section: 'Indian Channels',     name: 'All India',              url: BASE + 'countries/in.m3u' },
    { section: 'Indian Channels',     name: 'Malayalam',              url: BASE + 'languages/mal.m3u' },
    { section: 'Indian Channels',     name: 'Hindi',                  url: BASE + 'languages/hin.m3u' },
    { section: 'Indian Channels',     name: 'Tamil',                  url: BASE + 'languages/tam.m3u' },
    { section: 'Indian Channels',     name: 'Telugu',                 url: BASE + 'languages/tel.m3u' },
    { section: 'Indian Channels',     name: 'Kannada',                url: BASE + 'languages/kan.m3u' },
    { section: 'Indian Channels',     name: 'Bengali',                url: BASE + 'languages/ben.m3u' },
    { section: 'Indian Channels',     name: 'Marathi',                url: BASE + 'languages/mar.m3u' },
    { section: 'Indian Channels',     name: 'Punjabi',                url: BASE + 'languages/pan.m3u' },
    { section: 'Indian Channels',     name: 'Gujarati',               url: BASE + 'languages/guj.m3u' },
    { section: 'Indian Channels',     name: 'Urdu',                   url: BASE + 'languages/urd.m3u' },
    { section: 'Indian Channels',     name: 'Odia',                   url: BASE + 'languages/ory.m3u' },
    { section: 'Indian Channels',     name: 'Assamese',               url: BASE + 'languages/asm.m3u' },
    { section: 'Indian Channels',     name: 'Sindhi',                 url: BASE + 'languages/snd.m3u' },
    // ── Indian Genre (filtered from India playlist — Indian channels only) ───
    { section: 'Indian Genre',        name: 'Movies',                 url: BASE + 'countries/in.m3u', filterGroup: 'Movies' },
    { section: 'Indian Genre',        name: 'Sports',                 url: BASE + 'countries/in.m3u', filterGroup: 'Sports' },
    { section: 'Indian Genre',        name: 'Music',                  url: BASE + 'countries/in.m3u', filterGroup: 'Music' },
    { section: 'Indian Genre',        name: 'News',                   url: BASE + 'countries/in.m3u', filterGroup: 'News' },
    { section: 'Indian Genre',        name: 'Entertainment',          url: BASE + 'countries/in.m3u', filterGroup: 'Entertainment' },
    { section: 'Indian Genre',        name: 'Kids',                   url: BASE + 'countries/in.m3u', filterGroup: 'Kids' },
    { section: 'Indian Genre',        name: 'Religious',              url: BASE + 'countries/in.m3u', filterGroup: 'Religious' },
    { section: 'Indian Genre',        name: 'Documentary',            url: BASE + 'countries/in.m3u', filterGroup: 'Documentary' },
    { section: 'Indian Genre',        name: 'Cooking',                url: BASE + 'countries/in.m3u', filterGroup: 'Cooking' },
    // ── International ───────────────────────────────────────────────────────
    { section: 'International',       name: 'English',                url: BASE + 'languages/eng.m3u' },
    { section: 'International',       name: 'All channels (large)',   url: BASE + 'index.m3u' },
    { section: 'International',       name: 'Series',                 url: BASE + 'categories/series.m3u' },
    { section: 'International',       name: 'Animation',              url: BASE + 'categories/animation.m3u' },
    { section: 'International',       name: 'Family',                 url: BASE + 'categories/family.m3u' },
    { section: 'International',       name: 'Classic',                url: BASE + 'categories/classic.m3u' },
    { section: 'International',       name: 'Lifestyle',              url: BASE + 'categories/lifestyle.m3u' },
    { section: 'International',       name: 'Travel',                 url: BASE + 'categories/travel.m3u' },
    { section: 'International',       name: 'Comedy',                 url: BASE + 'categories/comedy.m3u' },
    { section: 'International',       name: 'Education',              url: BASE + 'categories/education.m3u' },
    { section: 'International',       name: 'Business',               url: BASE + 'categories/business.m3u' },
    { section: 'International',       name: 'Science & Tech',         url: BASE + 'categories/science.m3u' },
    { section: 'International',       name: 'Weather',                url: BASE + 'categories/weather.m3u' },
    // ── International Languages ─────────────────────────────────────────────
    { section: 'International Languages', name: 'Arabic',              url: BASE + 'languages/ara.m3u' },
    { section: 'International Languages', name: 'Spanish',             url: BASE + 'languages/spa.m3u' },
    { section: 'International Languages', name: 'French',              url: BASE + 'languages/fra.m3u' },
    { section: 'International Languages', name: 'German',              url: BASE + 'languages/deu.m3u' },
    { section: 'International Languages', name: 'Portuguese',          url: BASE + 'languages/por.m3u' },
    { section: 'International Languages', name: 'Russian',             url: BASE + 'languages/rus.m3u' },
    { section: 'International Languages', name: 'Turkish',             url: BASE + 'languages/tur.m3u' },
    { section: 'International Languages', name: 'Indonesian',          url: BASE + 'languages/ind.m3u' },
    { section: 'International Languages', name: 'Chinese',             url: BASE + 'languages/zho.m3u' },
    { section: 'International Languages', name: 'Japanese',            url: BASE + 'languages/jpn.m3u' },
    { section: 'International Languages', name: 'Korean',              url: BASE + 'languages/kor.m3u' },
    { section: 'Countries',            name: 'United Arab Emirates',   url: BASE + 'countries/ae.m3u' },
    { section: 'Countries',            name: 'Qatar',                  url: BASE + 'countries/qa.m3u' },
    { section: 'Countries',            name: 'Saudi Arabia',           url: BASE + 'countries/sa.m3u' },
    { section: 'Countries',            name: 'United Kingdom',         url: BASE + 'countries/gb.m3u' },
    { section: 'Countries',            name: 'United States',          url: BASE + 'countries/us.m3u' },
    { section: 'Countries',            name: 'Pakistan',               url: BASE + 'countries/pk.m3u' },
    { section: 'Countries',            name: 'Bangladesh',             url: BASE + 'countries/bd.m3u' },
    { section: 'Countries',            name: 'Sri Lanka',              url: BASE + 'countries/lk.m3u' },
    { section: 'Countries',            name: 'Nepal',                  url: BASE + 'countries/np.m3u' },
    { section: 'Countries',            name: 'Singapore',              url: BASE + 'countries/sg.m3u' },
    { section: 'Countries',            name: 'Malaysia',               url: BASE + 'countries/my.m3u' },
    { section: 'Countries',            name: 'Indonesia',              url: BASE + 'countries/id.m3u' },
    { section: 'Countries',            name: 'Philippines',            url: BASE + 'countries/ph.m3u' },
    { section: 'Countries',            name: 'Australia',              url: BASE + 'countries/au.m3u' },
    { section: 'Countries',            name: 'Canada',                 url: BASE + 'countries/ca.m3u' },
    { section: 'Countries',            name: 'Germany',                url: BASE + 'countries/de.m3u' },
    { section: 'Countries',            name: 'France',                 url: BASE + 'countries/fr.m3u' },
    { section: 'Countries',            name: 'Turkey',                 url: BASE + 'countries/tr.m3u' },
    { section: 'Countries',            name: 'Japan',                  url: BASE + 'countries/jp.m3u' },
    { section: 'Countries',            name: 'South Korea',            url: BASE + 'countries/kr.m3u' },
    { section: 'Countries',            name: 'South Africa',           url: BASE + 'countries/za.m3u' },
    { section: 'Countries',            name: 'Nigeria',                url: BASE + 'countries/ng.m3u' },
    { section: 'Countries',            name: 'Egypt',                  url: BASE + 'countries/eg.m3u' }
  ];

  // ── Extra (non-iptv-org) sources — individually toggled in Settings ───────
  var EXTRA_SOURCES = [
    { id: 'freetv',  name: 'Free-TV Global',  url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
      desc: 'Pluto TV, Plex, Samsung TV+, Roku, YouTube Live — free-to-air worldwide' },
    { id: 'indiantv', name: 'Indian TV', url: 'https://raw.githubusercontent.com/dark-N00B/IPtv/master/new_indian_tv.m3u',
      desc: 'Doordarshan, news, regional & entertainment — community-maintained, not from iptv-org' }
  ];

  // ── Storage helpers ──────────────────────────────────────────────────────
  function storageGet(key, def) {
    try { var v = localStorage.getItem(key); return v === null ? def : v; } catch(e) { return def; }
  }
  function storageSet(key, val) {
    try { localStorage.setItem(key, val); } catch(e) {}
  }
  function storageGetInt(key, def) { return parseInt(storageGet(key, def), 10) || def; }

  function isExtraEnabled(id) { return storageGet('hv_extra_' + id, '0') === '1'; }
  function setExtraEnabled(id, on) { storageSet('hv_extra_' + id, on ? '1' : '0'); }

  // ── State ────────────────────────────────────────────────────────────────
  var currentScreen = 'home';
  var screenHistory = [];  // stack of previous screens for back navigation
  var focusedEl = null;
  var channels = [];           // currently loaded channel list
  var filteredChannels = [];   // after search filter
  var currentChannel = null;
  var hlsPlayer = null;
  var themeIndex = storageGetInt('hv_theme', 0);
  var aspectMode = storageGetInt('hv_aspect', 0); // 0=stretch, 1=fit, 2=zoom
  var ASPECT_MODES = ['stretch', 'fit', 'zoom'];
  var ASPECT_LABELS = ['Stretch', 'Fit', 'Zoom'];
  var loadedPlaylistUrl = storageGet('hv_loaded_url', '');
  var lastChannelData = null;
  try { lastChannelData = JSON.parse(storageGet('hv_last_channel', 'null')); } catch(e) { lastChannelData = null; }
  var customUrls = [];
  var ctrlHideTimer = null;
  var idleFullscreenTimer = null;
  try { customUrls = JSON.parse(storageGet('hv_custom_urls', '[]')) || []; } catch(e) { customUrls = []; }

  var SCREENS = ['home', 'live', 'library', 'search', 'settings', 'about'];

  // ── DOM helpers ──────────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  // ── Theme ────────────────────────────────────────────────────────────────
  function applyTheme(idx) {
    themeIndex = idx;
    storageSet('hv_theme', idx);
    var t = THEMES[idx] || THEMES[0];
    var s = document.documentElement.style;
    s.setProperty('--bg',      t.bg);
    s.setProperty('--surface', t.surface);
    s.setProperty('--accent',  t.accent);
    s.setProperty('--glow',    t.glow);
    // also tint sidebar background directly
    var sb = document.getElementById('sidebar');
    if (sb) sb.style.background = t.surface;
    document.body.style.background = t.bg;
  }

  // ── Focus management ─────────────────────────────────────────────────────
  function visibleFocusables() {
    return all('.focusable').filter(function (el) {
      if (el.offsetWidth === 0 || el.offsetHeight === 0) return false;
      // Also exclude elements whose ancestor screen is hidden
      var node = el.parentNode;
      while (node && node !== document.body) {
        if (node.classList && node.classList.contains('hidden')) return false;
        node = node.parentNode;
      }
      return true;
    });
  }

  function setFocus(el) {
    if (!el) return;
    if (focusedEl) focusedEl.classList.remove('focused');
    focusedEl = el;
    el.classList.add('focused');
    // NOTE: el.focus() for inputs is called in activate() only (OK press),
    // NOT here — so arrow-key navigation to an input does NOT auto-open keyboard
    // Manual scroll for ch-list (scrollIntoView unreliable in WebOS Chromium 53)
    var chList = $('ch-list');
    if (chList && chList.contains(el)) {
      var elTop = el.offsetTop - chList.offsetTop;
      var elBottom = elTop + el.offsetHeight;
      var listScroll = chList.scrollTop;
      var listHeight = chList.offsetHeight;
      if (elTop < listScroll) {
        chList.scrollTop = elTop - 8;
      } else if (elBottom > listScroll + listHeight) {
        chList.scrollTop = elBottom - listHeight + 8;
      }
    } else if (el.scrollIntoView) {
      try { el.scrollIntoView({ block: 'nearest' }); } catch(e) {}
    }
  }

  function center(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function move(dir) {
    var list = visibleFocusables();
    if (!focusedEl || list.indexOf(focusedEl) === -1) { setFocus(list[0]); return; }
    // When focus is inside a content screen (not in the sidebar), restrict
    // spatial navigation to that screen's focusables only. This prevents
    // sidebar tiles from intercepting Up/Down navigation within settings,
    // library, etc.
    var sidebarEl = $('sidebar');
    var focusInSidebar = sidebarEl && sidebarEl.contains(focusedEl);
    if (!focusInSidebar && currentScreen !== 'home') {
      var screenEl = $('screen-' + currentScreen);
      if (screenEl) {
        var screenList = list.filter(function(el) { return screenEl.contains(el); });
        if (screenList.length > 0) { list = screenList; }
      }
    }
    var c = center(focusedEl);
    var best = null, bestScore = Infinity;
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el === focusedEl) continue;
      var p = center(el);
      var dx = p.x - c.x, dy = p.y - c.y;
      var ok = (dir === 'left'  && dx < -5) ||
               (dir === 'right' && dx >  5) ||
               (dir === 'up'    && dy < -5) ||
               (dir === 'down'  && dy >  5);
      if (!ok) continue;
      var main = (dir === 'left' || dir === 'right') ? Math.abs(dx) : Math.abs(dy);
      var side = (dir === 'left' || dir === 'right') ? Math.abs(dy) : Math.abs(dx);
      var score = main + side * 2.5;
      if (score < bestScore) { bestScore = score; best = el; }
    }
    if (best) setFocus(best);
  }

  // ── Aspect ratio ─────────────────────────────────────────────────────────
  function applyAspect(mode) {
    aspectMode = mode;
    storageSet('hv_aspect', mode);
    var video = $('hv-video');
    var wrap  = $('player-wrap');
    if (!video || !wrap) return;

    var cw = wrap.offsetWidth  || 1920;
    var ch = wrap.offsetHeight || 1080;
    var vw = video.videoWidth  || 16;
    var vh = video.videoHeight || 9;
    var w, h, t, l;

    if (mode === 0) {           // Stretch — fill the box completely
      w = cw; h = ch; t = 0; l = 0;
    } else if (mode === 1) {   // Fit — letterbox / pillarbox
      var ratio = Math.min(cw / vw, ch / vh);
      w = Math.round(vw * ratio);
      h = Math.round(vh * ratio);
      t = Math.round((ch - h) / 2);
      l = Math.round((cw - w) / 2);
    } else {                   // Zoom — fill and crop edges
      var ratio2 = Math.max(cw / vw, ch / vh);
      w = Math.round(vw * ratio2);
      h = Math.round(vh * ratio2);
      t = Math.round((ch - h) / 2);
      l = Math.round((cw - w) / 2);
    }

    video.style.width  = w + 'px';
    video.style.height = h + 'px';
    video.style.top    = t + 'px';
    video.style.left   = l + 'px';

    var lbl = $('ctrl-aspect-label');
    if (lbl) lbl.textContent = ASPECT_LABELS[mode];
  }

  function cycleAspect() {
    applyAspect((aspectMode + 1) % ASPECT_MODES.length);
  }

  // ── Fullscreen ────────────────────────────────────────────────────────────
  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement ||
              document.mozFullScreenElement);
  }

  function toggleFullscreen() {
    var wrap = $('player-wrap');
    var fsLabel = $('ctrl-fs-label');
    if (!wrap) return;
    if (isFullscreen()) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      if (fsLabel) fsLabel.textContent = '⛶ Full';
    } else {
      if (wrap.requestFullscreen) wrap.requestFullscreen();
      else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
      else if (wrap.mozRequestFullScreen) wrap.mozRequestFullScreen();
      if (fsLabel) fsLabel.textContent = '✕ Exit';
      // Push history so back key exits fullscreen via popstate
      try { history.pushState({ screen: 'live', playing: true, fullscreen: true }, ''); } catch(e) {}
    }
  }

  // Handle fullscreen change events
  function onFsChange() {
    var fsLabel = $('ctrl-fs-label');
    if (fsLabel) fsLabel.textContent = isFullscreen() ? '✕ Exit' : '⛶ Full';
    // Re-apply aspect ratio since container dimensions changed
    setTimeout(function () { applyAspect(aspectMode); }, 100);
  }
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);

  // ── Auto fullscreen when idle ─────────────────────────────────────────────
  function resetIdleFullscreenTimer() {
    clearTimeout(idleFullscreenTimer);
    if (currentChannel && !isFullscreen()) {
      idleFullscreenTimer = setTimeout(function () {
        if (currentChannel && !isFullscreen()) { toggleFullscreen(); }
      }, 10000);
    }
  }

  // ── Player controls overlay show/hide ─────────────────────────────────────
  function showPlayerControls() {
    var ctrl = $('player-controls');
    if (!ctrl) return;
    ctrl.classList.remove('hidden');
    // Also briefly re-show OSD
    var osdEl = $('player-osd');
    if (osdEl) {
      osdEl.classList.remove('osd-hidden');
      clearTimeout(window._osdHideTimer);
      window._osdHideTimer = setTimeout(function () {
        osdEl.classList.add('osd-hidden');
      }, 4000);
    }
    clearTimeout(ctrlHideTimer);
    ctrlHideTimer = setTimeout(function () {
      ctrl.classList.add('hidden');
    }, 5000);
  }

  // ── Screen navigation ─────────────────────────────────────────────────────
  // fromGoBack=true when called by goBack() — suppresses auto-focus resets in
  // renderSettings/renderLibrary and prevents auto-play on the Live TV screen.
  function showScreen(name, skipHistory, fromGoBack) {
    // PIN-locked screens
    if ((name === 'settings' || name === 'about') && !pinUnlocked) {
      var targetName = name;
      openPinOverlay(function () {
        pinUnlocked = true;
        showScreen(targetName, skipHistory, fromGoBack);
        pinUnlocked = false;
      });
      return;
    }
    pinUnlocked = false;
    if (!skipHistory && currentScreen !== name) {
      screenHistory.push(currentScreen);
      if (screenHistory.length > 10) screenHistory.shift(); // cap stack
    }
    currentScreen = name;
    for (var i = 0; i < SCREENS.length; i++) {
      var s = SCREENS[i];
      var el = $('screen-' + s);
      if (el) el.classList.toggle('hidden', s !== name);
    }
    all('.menu-item').forEach(function (m) {
      m.classList.toggle('active', m.getAttribute('data-screen') === name);
    });
    // Push history state only on forward navigation so popstate fires on next back press.
    if (!skipHistory) {
      try { history.pushState({ screen: name }, ''); } catch(e) {}
    }
    // per-screen setup
    if (name === 'live') {
      renderChannelList();
      var chSearch = $('ch-search');
      // Always focus ch-search regardless of whether channels are loaded
      if (chSearch) {
        setTimeout(function () { setFocus(chSearch); }, 60);
      }
      // Auto-restore last channel on forward navigation only (not goBack, not mid-play)
      if (!fromGoBack && !currentChannel && lastChannelData && lastChannelData.url && channels.length > 0) {
        var found = false;
        for (var lci = 0; lci < channels.length; lci++) {
          if (channels[lci].url === lastChannelData.url) { found = true; break; }
        }
        if (found) {
          setTimeout(function () {
            if (!currentChannel && lastChannelData) {
              playUrl(lastChannelData.name, lastChannelData.group, lastChannelData.url);
            }
          }, 200);
        }
      }
    } else if (name === 'library') {
      renderLibrary();
      if (!fromGoBack) {
        setTimeout(function () {
          var screenEl2 = $('screen-library');
          if (screenEl2 && currentScreen === 'library') {
            var first2 = screenEl2.querySelector('.focusable');
            if (first2) setFocus(first2);
          }
        }, 150);
      }
    } else if (name === 'settings') {
      renderSettings(fromGoBack); // suppress focus-reset when returning via goBack
    } else if (name === 'search') {
      setTimeout(function () {
        var si = $('search-input');
        if (si) {
          setFocus(si);
          // If returning to search with an existing query, re-render results
          if (fromGoBack && si.value) renderSearchResults(si.value);
        }
      }, 60);
    }
  }

  // ── Activate (OK press or click) ─────────────────────────────────────────
  function activate() {
    if (!focusedEl) return;
    // Handle PIN keypad OK presses
    var pinK = focusedEl.getAttribute('data-k');
    if (pinK !== null) { handlePinKey(pinK); return; }
    if (focusedEl.id === 'pin-clear') {
      pinEntry = pinEntry.slice(0, -1); updatePinDots(); showPinMsg(''); return;
    }
    if (focusedEl.id === 'pin-cancel' || focusedEl.id === 'pin-back') { closePinOverlay(); return; }
    var sc = focusedEl.getAttribute('data-screen');
    if (sc) { showScreen(sc); return; }
    var gt = focusedEl.getAttribute('data-goto');
    if (gt) { showScreen(gt); return; }
    var act = focusedEl.getAttribute('data-action');
    if (act === 'exit') { try { window.close(); } catch(e2) {} return; }
    var libUrl = focusedEl.getAttribute('data-liburl');
    if (libUrl) { var libFilter = focusedEl.getAttribute('data-libfilter'); loadPlaylist(libUrl, focusedEl.textContent, libFilter); return; }
    var chUrl = focusedEl.getAttribute('data-churl');
    if (chUrl !== null) { playChannel(parseInt(focusedEl.getAttribute('data-chidx'), 10)); return; }
    var srUrl = focusedEl.getAttribute('data-srurl');
    if (srUrl !== null) { playUrl(focusedEl.getAttribute('data-srname'), focusedEl.getAttribute('data-srgroup'), srUrl); return; }
    if (focusedEl.id === 'custom-add') { addCustomUrl(); return; }
    if (focusedEl.id === 'change-pin-btn') { startChangePinFlow(); return; }
    if (focusedEl.id === 'app-lock-btn') {
      if (!appLockEnabled) {
        // Enabling: require current PIN first for security
        openPinOverlay(function () { setAppLock(true); });
        document.getElementById('pin-title').textContent = 'Confirm PIN to Enable App Lock';
      } else {
        setAppLock(false);
      }
      return;
    }
    if (focusedEl.id === 'ch-refresh') { var chRef = $('ch-refresh'); if (chRef) chRef.click(); return; }
    if (focusedEl.id === 'ctrl-aspect') { cycleAspect(); return; }
    if (focusedEl.id === 'ctrl-fullscreen') { toggleFullscreen(); return; }
    if (focusedEl.id === 'ctrl-exit') { goBack(); return; }
    var thIdx = focusedEl.getAttribute('data-theme');
    if (thIdx !== null) { applyTheme(parseInt(thIdx, 10)); renderSettings(); return; }
    var delIdx = focusedEl.getAttribute('data-delurl');
    if (delIdx !== null) { deleteCustomUrl(focusedEl.getAttribute('data-delurl')); return; }
    var extraId = focusedEl.getAttribute('data-extraid');
    if (extraId !== null) {
      var newState = !isExtraEnabled(extraId);
      setExtraEnabled(extraId, newState);
      focusedEl.textContent = newState ? 'ON' : 'OFF';
      if (newState) { focusedEl.classList.add('extra-toggle-on'); }
      else { focusedEl.classList.remove('extra-toggle-on'); }
      renderLibrary();
      return;
    }
    // For inputs: OK press opens the virtual keyboard by calling native focus
    if (focusedEl.tagName === 'INPUT' || focusedEl.tagName === 'TEXTAREA') {
      try { focusedEl.focus(); } catch(e) {}
    }
  }

  // Returns true when goBack() navigated to a different screen (popstate re-seed needed),
  // false when it only stopped playback or fullscreen (no screen change).
  function goBack() {
    // 1. Exit fullscreen first if active
    if (isFullscreen()) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      return false; // no screen change
    }
    // 2. If a channel is playing, stop it and return to channel panel
    if (currentChannel) {
      clearTimeout(idleFullscreenTimer);
      var video2 = $('hv-video');
      if (video2) { video2.pause(); video2.src = ''; }
      if (hlsPlayer) { try { hlsPlayer.destroy(); } catch(e) {} hlsPlayer = null; }
      currentChannel = null;
      updateNowPlayingBar();
      var ctrl2 = $('player-controls');
      if (ctrl2) ctrl2.classList.add('hidden');
      var osdEl2 = $('player-osd');
      if (osdEl2) osdEl2.classList.add('osd-hidden');
      // Show channel panel + sidebar again
      var liveScreen2 = $('screen-live');
      if (liveScreen2) liveScreen2.classList.remove('playing');
      var appEl2 = $('app');
      if (appEl2) appEl2.classList.remove('watching');
      // Focus the right element depending on which screen we're on (search vs live)
      setTimeout(function () {
        if (currentScreen === 'search') {
          var si2 = $('search-input');
          if (si2) setFocus(si2);
        } else {
          var chSearch2 = $('ch-search');
          if (chSearch2) setFocus(chSearch2);
        }
      }, 60);
      return false; // no screen change
    }
    // 3. Navigate back within the app — go to previous screen in history
    if (currentScreen !== 'home') {
      var prev = screenHistory.length > 0 ? screenHistory.pop() : 'home';
      showScreen(prev, true, true); // skipHistory=true, fromGoBack=true
      // Set fallback focus only for screens that don't set their own focus (home, about).
      // live/search/library/settings all handle focus inside their own setup code.
      if (prev === 'home' || prev === 'about') {
        setTimeout(function () {
          var target = document.querySelector('.menu-item[data-screen="' + prev + '"]') ||
                       document.querySelector('#screen-' + prev + ' .focusable');
          if (target) setFocus(target);
        }, 80); // slightly after render (60ms) so we don't race with renderLibrary etc.
      }
      return true; // screen changed
    }
    // 4. Already on home — do nothing (prevent app exit on WebOS)
    return false;
  }

  // ── Keyboard handler ──────────────────────────────────────────────────────
  function handleKeyDown(e) {
    var k = e.keyCode;

    // If PIN overlay is open, handle number/backspace/escape keys
    var pinOv = document.getElementById('pin-overlay');
    if (pinOv && !pinOv.classList.contains('hidden')) {
      // Debug: show keycode in PIN message so we can identify the Back key
      var dbgEl = document.getElementById('pin-msg');
      if (dbgEl && k !== 37 && k !== 38 && k !== 39 && k !== 40 && k !== 13) { dbgEl.textContent = 'key:' + k; }
      // 0–9 keys — check keyCode (48-57, numpad 96-105) and e.key string
      var digitStr = null;
      if (k >= 48 && k <= 57) { digitStr = String(k - 48); }
      else if (k >= 96 && k <= 105) { digitStr = String(k - 96); }
      else if (e.key && e.key.length === 1 && e.key >= '0' && e.key <= '9') { digitStr = e.key; }
      if (digitStr !== null) {
        handlePinKey(digitStr);
        e.preventDefault(); e.stopPropagation();
        return false;
      }
      // Backspace: clear last digit; if nothing entered, close overlay (acts as back)
      if (k === 8) {
        if (pinEntry.length === 0) {
          closePinOverlay(); e.preventDefault(); e.stopPropagation(); return false;
        }
        pinEntry = pinEntry.slice(0, -1);
        updatePinDots();
        showPinMsg('');
        e.preventDefault(); e.stopPropagation();
        return false;
      }
      // Escape / Back / XF86Back cancels
      if (k === 27 || k === 461 || k === 10009) {
        closePinOverlay();
        e.preventDefault(); e.stopPropagation();
        return false;
      }
      // Allow arrow/OK keys to navigate within the keypad, block everything else
      if (k !== 37 && k !== 38 && k !== 39 && k !== 40 && k !== 13) {
        e.preventDefault(); e.stopPropagation();
        return false;
      }
    }

    var isInput = focusedEl && (focusedEl.tagName === 'INPUT' || focusedEl.tagName === 'TEXTAREA');
    var isChSearch = focusedEl && focusedEl.id === 'ch-search';
    var isCustomUrl = focusedEl && focusedEl.id === 'custom-url';
    // Reset idle-fullscreen timer on any key while watching
    if (currentChannel) { resetIdleFullscreenTimer(); }

    // Back button — handle first before anything else
    // But let Backspace (k=8) work normally when user is typing in the search box
    if (k === 461 || k === 8) {
      if (k === 8 && isInput) {
        return; // let the browser delete the character in any input field
      }
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      goBack();
      return false;
    }

    var isCtrlFocused = focusedEl && (
      focusedEl.id === 'ctrl-aspect' ||
      focusedEl.id === 'ctrl-fullscreen' ||
      focusedEl.id === 'ctrl-exit'
    );

    // Arrow keys while watching a channel — show controls and navigate within them
    if (currentScreen === 'live' && currentChannel && !isInput) {
      if (k === 37 || k === 38 || k === 39 || k === 40) {
        var ctrl0 = $('player-controls');
        var ctrlVisible0 = ctrl0 && !ctrl0.classList.contains('hidden');
        var btns = ['ctrl-fullscreen', 'ctrl-aspect', 'ctrl-exit'];
        // Every arrow key resets the hide timer
        showPlayerControls();
        if (!ctrlVisible0) {
          // Controls were hidden — focus exit button
          setTimeout(function () {
            var exitBtn0 = $('ctrl-exit');
            if (exitBtn0) setFocus(exitBtn0);
          }, 50);
          e.preventDefault();
          return;
        } else if (isCtrlFocused) {
          // On a ctrl button — navigate left/right between them
          var ci = btns.indexOf(focusedEl.id);
          if (k === 37 && ci > 0) { setFocus($(btns[ci - 1])); }
          else if (k === 39 && ci < btns.length - 1) { setFocus($(btns[ci + 1])); }
          e.preventDefault();
          return;
        } else {
          // Controls visible, focus not on ctrl — move focus to exit button
          var exitBtn1 = $('ctrl-exit');
          if (exitBtn1) setFocus(exitBtn1);
          e.preventDefault();
          return;
        }
      }
    }

    // Linear Up/Down navigation inside the channel list — more reliable than
    // the spatial algorithm for a long scrolling list of items.
    var isChItem = focusedEl && focusedEl.classList.contains('ch-item');
    if (isChItem && (k === 38 || k === 40)) {
      var chList2 = $('ch-list');
      var chItems = chList2 ? Array.prototype.slice.call(chList2.querySelectorAll('.ch-item')) : [];
      var ci3 = chItems.indexOf(focusedEl);
      if (k === 38) { // Up — prev item, or back to ch-search at top
        if (ci3 > 0) { setFocus(chItems[ci3 - 1]); }
        else { var cs3 = $('ch-search'); if (cs3) setFocus(cs3); }
      } else { // Down — next item (stop at bottom)
        if (ci3 < chItems.length - 1) { setFocus(chItems[ci3 + 1]); }
      }
      e.preventDefault();
      return;
    }

    if (k === 37) {
      if (!isInput) { move('left'); e.preventDefault(); }
    } else if (k === 38) {
      if (!isInput) { move('up'); e.preventDefault(); }
      else if (isChSearch) { move('up'); e.preventDefault(); }
      else if (isCustomUrl) { move('up'); e.preventDefault(); }
    } else if (k === 39) {
      if (!isInput) { move('right'); e.preventDefault(); }
    } else if (k === 40) {
      if (!isInput) { move('down'); e.preventDefault(); }
      else if (isCustomUrl) { move('down'); e.preventDefault(); }
      else if (isChSearch) {
        var firstCh = document.querySelector('#ch-list .ch-item');
        if (firstCh) { setFocus(firstCh); e.preventDefault(); }
        else { move('down'); e.preventDefault(); }
      }
    } else if (k === 13) {
      if (isInput) {
        // OK on a focused input — open virtual keyboard
        activate();
        e.preventDefault();
      } else if (!isInput) {
        if (currentScreen === 'live' && currentChannel) {
          var ctrl = $('player-controls');
          var ctrlVisible = ctrl && !ctrl.classList.contains('hidden');
          if (ctrlVisible && isCtrlFocused) {
            activate();
          } else if (!ctrlVisible) {
            showPlayerControls();
            var exitBtn = $('ctrl-exit');
            if (exitBtn) setFocus(exitBtn);
          } else {
            activate();
          }
        } else {
          activate();
        }
        e.preventDefault();
      }
    }
  }

  // Single capture-phase listener on window only (avoids double-firing)
  window.addEventListener('keydown', handleKeyDown, true);

  // ── Magic Remote / mouse wheel scroll throttle on channel list ─────────────
  // LG Magic Remote fires many wheel events per gesture — cap to one focus-move
  // per ~150ms so the list doesn't fly past every channel.
  var wheelThrottleTimer = null;
  var chListEl = $('ch-list');
  if (chListEl) {
    chListEl.addEventListener('wheel', function(e) {
      e.preventDefault();
      if (wheelThrottleTimer) return;
      wheelThrottleTimer = setTimeout(function() { wheelThrottleTimer = null; }, 150);
      // Move focus one item up or down
      var items = Array.prototype.slice.call(chListEl.querySelectorAll('.ch-item'));
      if (!items.length) return;
      var idx = focusedEl ? items.indexOf(focusedEl) : -1;
      if (e.deltaY > 0) {
        idx = idx < items.length - 1 ? idx + 1 : idx;
      } else {
        idx = idx > 0 ? idx - 1 : 0;
      }
      setFocus(items[idx]);
    }, { passive: false });
  }

  // ── WebOS back key via history API ────────────────────────────────────────
  // WebOS routes back button through popstate when history entries exist.
  // After goBack() navigates to the previous screen (with skipHistory=true,
  // so no new entry is pushed), we re-seed ONE entry so the next back press
  // also fires popstate instead of exiting the app.
  window.addEventListener('popstate', function (e) {
    var navigated = goBack();
    // Re-seed a history entry ONLY when a screen change occurred so the next
    // back press also fires popstate.  When goBack() merely stopped a channel
    // the browser has already moved its pointer back past the 'playing' entry —
    // adding another entry here would pile up and produce unexpected behaviour.
    if (navigated) {
      setTimeout(function () {
        try { history.pushState({ screen: currentScreen }, ''); } catch(e) {}
      }, 0);
    }
  });
  // Seed two entries at startup: one bottom anchor + one for the first back press
  try {
    history.replaceState({ screen: 'home' }, '');
    history.pushState({ screen: 'home' }, '');
  } catch(e) {}

  // ── Magic Remote hover & click ────────────────────────────────────────────
  document.addEventListener('mouseover', function (e) {
    var el = e.target;
    while (el && el !== document.body) {
      if (el.classList && el.classList.contains('focusable')) {
        setFocus(el); return;
      }
      el = el.parentNode;
    }
  });
  document.addEventListener('click', function (e) {
    // If watching a channel and clicking on player area, show controls
    if (currentScreen === 'live' && currentChannel) {
      var pw = $('player-wrap');
      if (pw && pw.contains(e.target)) {
        showPlayerControls();
      }
    }
    var el = e.target;
    while (el && el !== document.body) {
      if (el.classList && el.classList.contains('focusable')) {
        setFocus(el); activate(); return;
      }
      el = el.parentNode;
    }
  });

  // ── M3U parser ───────────────────────────────────────────────────────────
  function parseM3u(text) {
    var out = [];
    var name = '', group = 'Other', logo = null;
    var attrRe = /([\w-]+)="([^"]*)"/g;
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i].replace(/\r$/, '').trim();
      if (l.indexOf('#EXTINF') === 0) {
        // reset
        name = ''; group = 'Other'; logo = null;
        // parse attrs
        var m;
        attrRe.lastIndex = 0;
        while ((m = attrRe.exec(l)) !== null) {
          if (m[1] === 'group-title' && m[2]) group = m[2];
          if (m[1] === 'tvg-logo' && m[2]) logo = m[2];
        }
        // name after last comma
        var ci = l.lastIndexOf(',');
        if (ci !== -1) name = l.substring(ci + 1).trim();
      } else if (l.length > 0 && l.charAt(0) !== '#') {
        out.push({ name: name || l, url: l, group: group, logo: logo });
        name = ''; group = 'Other'; logo = null;
      }
    }
    return out;
  }

  // ── XHR fetch ────────────────────────────────────────────────────────────
  function xhrGet(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 30000;
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 400) {
        cb(null, xhr.responseText);
      } else {
        cb('HTTP ' + xhr.status);
      }
    };
    xhr.onerror   = function () { cb('Network error'); };
    xhr.ontimeout = function () { cb('Timeout'); };
    xhr.send();
  }

  // ── Load playlist ─────────────────────────────────────────────────────────
  function loadPlaylist(url, label, filterGroup) {
    var libStatus = $('lib-status');
    if (libStatus) libStatus.textContent = 'Loading ' + (label || url) + '…';
    xhrGet(url, function (err, text) {
      if (err) {
        if (libStatus) libStatus.textContent = 'Failed to load: ' + err;
        return;
      }
      channels = parseM3u(text);
      if (filterGroup) {
        var fg = filterGroup.toLowerCase();
        channels = channels.filter(function (ch) { return ch.group.toLowerCase().indexOf(fg) !== -1; });
      }
      filteredChannels = channels.slice();
      loadedPlaylistUrl = url;
      storageSet('hv_loaded_url', url);
      if (libStatus) libStatus.textContent = 'Loaded: ' + channels.length + ' channels from ' + (label || url);
      // Update now-playing bar hint on home
      updateNowPlayingBar();
      // Mark library item
      all('.lib-item').forEach(function (el) {
        el.classList.toggle('lib-loaded', el.getAttribute('data-liburl') === url);
      });
      // Switch to Live TV
      showScreen('live');
    });
  }

  // ── Channel list renderer ─────────────────────────────────────────────────
  function renderChannelList() {
    var list = $('ch-list');
    var empty = $('ch-empty');
    if (!list) return;
    list.innerHTML = '';
    var query = ($('ch-search') ? $('ch-search').value : '').toLowerCase();
    filteredChannels = channels.filter(function (c) {
      return !query || c.name.toLowerCase().indexOf(query) !== -1 || c.group.toLowerCase().indexOf(query) !== -1;
    });
    if (filteredChannels.length === 0) {
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');
    for (var i = 0; i < filteredChannels.length; i++) {
      (function (idx) {
        var c = filteredChannels[idx];
        var div = document.createElement('div');
        div.className = 'ch-item focusable' + (currentChannel && currentChannel.url === c.url ? ' ch-playing' : '');
        div.setAttribute('tabindex', '-1');
        div.setAttribute('data-churl', c.url);
        div.setAttribute('data-chidx', idx);
        div.innerHTML = '<div class="ch-name">' + esc(c.name) + '</div>' +
                        '<div class="ch-group">' + esc(c.group) + '</div>';
        list.appendChild(div);
      })(i);
    }
  }

  // ── Channel search input ──────────────────────────────────────────────────
  var chSearchTimer = null;
  var chSearchEl = $('ch-search');
  if (chSearchEl) {
    chSearchEl.addEventListener('input', function () {
      clearTimeout(chSearchTimer);
      chSearchTimer = setTimeout(renderChannelList, 200);
    });
    chSearchEl.addEventListener('focus', function () { setFocus(chSearchEl); });
  }

  // ── Refresh button ────────────────────────────────────────────────────────
  var chRefreshEl = $('ch-refresh');
  if (chRefreshEl) {
    chRefreshEl.addEventListener('click', function () {
      if (!loadedPlaylistUrl) return;
      chRefreshEl.classList.add('refreshing');
      var origText = chRefreshEl.textContent;
      chRefreshEl.textContent = '↺ Loading…';
      var libStatus = $('lib-status');
      if (libStatus) libStatus.textContent = 'Refreshing playlist…';
      xhrGet(loadedPlaylistUrl, function (err, text) {
        chRefreshEl.classList.remove('refreshing');
        chRefreshEl.textContent = origText;
        if (err) {
          if (libStatus) libStatus.textContent = 'Refresh failed: ' + err;
          return;
        }
        channels = parseM3u(text);
        filteredChannels = channels.slice();
        if (libStatus) libStatus.textContent = 'Refreshed: ' + channels.length + ' channels';
        renderChannelList();
      });
    });
    chRefreshEl.addEventListener('focus', function () { setFocus(chRefreshEl); });
  }

  var searchInputEl = $('search-input');
  if (searchInputEl) {
    searchInputEl.addEventListener('input', function () {
      renderSearchResults(searchInputEl.value);
    });
    searchInputEl.addEventListener('focus', function () { setFocus(searchInputEl); });
  }

  // ── Play channel by index in filteredChannels ─────────────────────────────
  function playChannel(idx) {
    var c = filteredChannels[idx];
    if (!c) return;
    playUrl(c.name, c.group, c.url);
  }

  function playUrl(name, group, url) {
    currentChannel = { name: name, group: group, url: url };
    // Persist last-watched channel so it can be restored on next visit to Live TV
    lastChannelData = { name: name, group: group, url: url };
    storageSet('hv_last_channel', JSON.stringify(lastChannelData));
    updateNowPlayingBar();
    var video = $('hv-video');
    var spinner = $('player-spinner');
    var errEl = $('player-error');
    var osdName = $('osd-name');
    var osdGroup = $('osd-group');
    var osdStatus = $('osd-status');
    if (osdName) osdName.textContent = name;
    if (osdGroup) osdGroup.textContent = group;
    if (osdStatus) osdStatus.textContent = '';
    var ctrlName = $('ctrl-name');
    var ctrlGroup = $('ctrl-group');
    if (ctrlName) ctrlName.textContent = name;
    if (ctrlGroup) ctrlGroup.textContent = group;
    // Show OSD then auto-hide after 4 seconds
    var osdEl = $('player-osd');
    if (osdEl) {
      osdEl.classList.remove('osd-hidden');
      clearTimeout(window._osdHideTimer);
      window._osdHideTimer = setTimeout(function () {
        osdEl.classList.add('osd-hidden');
      }, 4000);
    }
    // Hide channel panel + sidebar — expand video to full width
    var liveScreen = $('screen-live');
    if (liveScreen) liveScreen.classList.add('playing');
    var appEl = $('app');
    if (appEl) appEl.classList.add('watching');
    // Push history so webOS back key triggers popstate → goBack()
    try { history.pushState({ screen: 'live', playing: true }, ''); } catch(e) {}
    showPlayerControls();
    resetIdleFullscreenTimer();
    if (spinner) spinner.classList.remove('hidden');
    if (errEl) errEl.classList.add('hidden');
    // destroy previous hls
    if (hlsPlayer) {
      try { hlsPlayer.destroy(); } catch(e) {}
      hlsPlayer = null;
    }
    var isHls = url.toLowerCase().indexOf('.m3u8') !== -1 ||
                url.toLowerCase().indexOf('.m3u')  !== -1;
    if (isHls && window.Hls && Hls.isSupported()) {
      hlsPlayer = new Hls({ enableWorker: false, maxBufferLength: 30 });
      hlsPlayer.loadSource(url);
      hlsPlayer.attachMedia(video);
      hlsPlayer.on(Hls.Events.MANIFEST_PARSED, function () {
        video.play();
        if (spinner) spinner.classList.add('hidden');
        if (osdStatus) osdStatus.textContent = 'Live';
      });
      video.addEventListener('loadedmetadata', function () { applyAspect(aspectMode); });
      hlsPlayer.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          if (spinner) spinner.classList.add('hidden');
          if (errEl) errEl.classList.remove('hidden');
          if (osdStatus) osdStatus.textContent = 'Error';
        }
      });
    } else {
      // Native video (MP4 / native HLS on some platforms)
      video.src = url;
      video.load();
      video.play();
      video.oncanplay = function () {
        if (spinner) spinner.classList.add('hidden');
        if (osdStatus) osdStatus.textContent = 'Live';
        applyAspect(aspectMode);
      };
      video.onerror = function () {
        if (spinner) spinner.classList.add('hidden');
        if (errEl) errEl.classList.remove('hidden');
        if (osdStatus) osdStatus.textContent = 'Error';
      };
    }
    // highlight in list
    all('.ch-item').forEach(function (el) {
      el.classList.toggle('ch-playing', el.getAttribute('data-churl') === url);
    });
  }

  // ── Now-playing bar on Home ───────────────────────────────────────────────
  function updateNowPlayingBar() {
    var bar = $('now-playing-bar');
    var npName = $('np-name');
    if (!bar) return;
    if (currentChannel) {
      bar.classList.remove('hidden');
      if (npName) npName.textContent = currentChannel.name;
    } else {
      bar.classList.add('hidden');
    }
  }

  // ── Library renderer ──────────────────────────────────────────────────────
  function renderLibrary() {
    var container = $('lib-sections');
    if (!container) return;
    container.innerHTML = '';
    // group by section
    var sections = [];
    var sectionMap = {};
    for (var i = 0; i < LIBRARY.length; i++) {
      var item = LIBRARY[i];
      if (!sectionMap[item.section]) {
        sectionMap[item.section] = [];
        sections.push(item.section);
      }
      sectionMap[item.section].push(item);
    }
    // custom urls section
    if (customUrls.length > 0) {
      var customSectionDiv = document.createElement('div');
      customSectionDiv.innerHTML = '<div class="lib-section-title">My Playlists</div>';
      var customRow = document.createElement('div');
      customRow.className = 'lib-row';
      for (var ci = 0; ci < customUrls.length; ci++) {
        (function (u) {
          var label = u.length > 50 ? u.substring(0, 50) + '…' : u;
          var btn = document.createElement('div');
          btn.className = 'lib-item focusable' + (loadedPlaylistUrl === u ? ' lib-loaded' : '');
          btn.setAttribute('tabindex', '-1');
          btn.setAttribute('data-liburl', u);
          btn.textContent = label;
          customRow.appendChild(btn);
        })(customUrls[ci]);
      }
      customSectionDiv.appendChild(customRow);
      container.appendChild(customSectionDiv);
    }
    // Enabled extra sources section (shown before iptv-org, only when at least one is on)
    var enabledExtras = EXTRA_SOURCES.filter(function (s) { return isExtraEnabled(s.id); });
    if (enabledExtras.length > 0) {
      var extraSecDiv = document.createElement('div');
      var extraTitleDiv = document.createElement('div');
      extraTitleDiv.className = 'lib-section-title';
      extraTitleDiv.textContent = '⭐ Extra Sources';
      extraSecDiv.appendChild(extraTitleDiv);
      var extraRow = document.createElement('div');
      extraRow.className = 'lib-row';
      for (var ei = 0; ei < enabledExtras.length; ei++) {
        (function (ex) {
          var btn = document.createElement('div');
          btn.className = 'lib-item lib-extra focusable' + (loadedPlaylistUrl === ex.url ? ' lib-loaded' : '');
          btn.setAttribute('tabindex', '-1');
          btn.setAttribute('data-liburl', ex.url);
          btn.innerHTML = '<span class="lib-item-name">' + esc(ex.name) + '</span>' +
                          '<span class="lib-item-note">Not from iptv-org</span>';
          extraRow.appendChild(btn);
        })(enabledExtras[ei]);
      }
      extraSecDiv.appendChild(extraRow);
      container.appendChild(extraSecDiv);
    }

    for (var si = 0; si < sections.length; si++) {
      var sName = sections[si];
      var secDiv = document.createElement('div');
      var titleDiv = document.createElement('div');
      titleDiv.className = 'lib-section-title';
      titleDiv.textContent = sName;
      secDiv.appendChild(titleDiv);
      var rowDiv = document.createElement('div');
      rowDiv.className = 'lib-row';
      var items = sectionMap[sName];
      for (var ii = 0; ii < items.length; ii++) {
        (function (it) {
          var btn = document.createElement('div');
          btn.className = 'lib-item focusable' + (loadedPlaylistUrl === it.url ? ' lib-loaded' : '');
          btn.setAttribute('tabindex', '-1');
          btn.setAttribute('data-liburl', it.url);
          if (it.filterGroup) btn.setAttribute('data-libfilter', it.filterGroup);
          btn.textContent = it.name;
          rowDiv.appendChild(btn);
        })(items[ii]);
      }
      secDiv.appendChild(rowDiv);
      container.appendChild(secDiv);
    }
    // focus first item
    setTimeout(function () {
      var first = container.querySelector('.lib-item');
      if (first) setFocus(first);
    }, 60);
  }

  // ── Search renderer ───────────────────────────────────────────────────────
  function renderSearchResults(query) {
    var container = $('search-results');
    if (!container) return;
    container.innerHTML = '';
    if (!query || query.length < 2) return;
    var q = query.toLowerCase();
    var matches = channels.filter(function (c) {
      return c.name.toLowerCase().indexOf(q) !== -1 || c.group.toLowerCase().indexOf(q) !== -1;
    }).slice(0, 80);
    for (var i = 0; i < matches.length; i++) {
      (function (c) {
        var div = document.createElement('div');
        div.className = 'sr-item focusable';
        div.setAttribute('tabindex', '-1');
        div.setAttribute('data-srurl', c.url);
        div.setAttribute('data-srname', c.name);
        div.setAttribute('data-srgroup', c.group);
        div.innerHTML = '<div class="sr-name">' + esc(c.name) + '</div>' +
                        '<div class="sr-group">' + esc(c.group) + '</div>';
        container.appendChild(div);
      })(matches[i]);
    }
  }

  // ── Settings renderer ──────────────────────────────────────────────────────
  // suppressFocus=true when called from goBack() so we don't snap focus back
  // to the first theme button when the user was somewhere deeper in settings.
  function renderSettings(suppressFocus) {
    var themeRow = $('theme-row');
    if (themeRow) {
      themeRow.innerHTML = '';
      for (var i = 0; i < THEMES.length; i++) {
        (function (idx) {
          var btn = document.createElement('div');
          btn.className = 'theme-btn focusable' + (themeIndex === idx ? ' theme-active' : '');
          btn.style.background = THEMES[idx].surface;
          btn.style.color = THEMES[idx].accent;
          btn.setAttribute('tabindex', '-1');
          btn.setAttribute('data-theme', idx);
          btn.textContent = THEMES[idx].name;
          themeRow.appendChild(btn);
        })(i);
      }
    }
    var savedList = $('saved-list');
    if (savedList) {
      savedList.innerHTML = '';
      var allUrls = customUrls.slice();
      if (loadedPlaylistUrl && allUrls.indexOf(loadedPlaylistUrl) === -1) {
        // show currently loaded url even if not saved as custom
      }
      if (allUrls.length === 0) {
        savedList.innerHTML = '<p class="info">No custom playlists saved yet.</p>';
      } else {
        for (var ci = 0; ci < allUrls.length; ci++) {
          (function (u, idx) {
            var div = document.createElement('div');
            div.className = 'saved-item';
            div.innerHTML = '<span class="saved-url">' + esc(u) + '</span>' +
              '<span class="saved-del focusable" tabindex="-1" data-delurl="' + esc(u) + '">✕</span>';
            savedList.appendChild(div);
          })(allUrls[ci], ci);
        }
      }
    }
    var extraList = $('extra-sources-list');
    if (extraList) {
      extraList.innerHTML = '';
      for (var xi = 0; xi < EXTRA_SOURCES.length; xi++) {
        (function (src) {
          var on = isExtraEnabled(src.id);
          var row = document.createElement('div');
          row.className = 'extra-toggle-row';
          var info = document.createElement('div');
          info.className = 'extra-toggle-info';
          info.innerHTML = '<span class="extra-toggle-name">' + esc(src.name) + '</span>' +
                           '<span class="extra-toggle-desc">' + esc(src.desc) + '</span>';
          var btn = document.createElement('button');
          btn.className = 'extra-toggle-btn focusable' + (on ? ' extra-toggle-on' : '');
          btn.setAttribute('tabindex', '-1');
          btn.setAttribute('data-extraid', src.id);
          btn.textContent = on ? 'ON' : 'OFF';
          row.appendChild(info);
          row.appendChild(btn);
          extraList.appendChild(row);
        })(EXTRA_SOURCES[xi]);
      }
    }
    var appLockBtn = document.getElementById('app-lock-btn');
    if (appLockBtn) {
      appLockBtn.textContent = appLockEnabled ? '🔒 App Lock: ON' : '🔓 App Lock: OFF';
      appLockBtn.className = 'btn focusable' + (appLockEnabled ? ' extra-toggle-on' : '');
      appLockBtn.setAttribute('tabindex', '-1');
    }
    if (!suppressFocus) {
      setTimeout(function () {
        var first = $('theme-row') ? $('theme-row').querySelector('.theme-btn') : null;
        if (first) setFocus(first);
      }, 150);
    }
  }

  function addCustomUrl() {
    var input = $('custom-url');
    if (!input) return;
    var url = input.value.trim();
    if (!url || url.indexOf('http') !== 0) return;
    if (customUrls.indexOf(url) === -1) {
      customUrls.push(url);
      storageSet('hv_custom_urls', JSON.stringify(customUrls));
    }
    input.value = '';
    renderSettings();
    renderLibrary();
  }

  function deleteCustomUrl(url) {
    customUrls = customUrls.filter(function (u) { return u !== url; });
    storageSet('hv_custom_urls', JSON.stringify(customUrls));
    renderSettings();
    renderLibrary();
  }

  // ── HTML escaping ─────────────────────────────────────────────────────────
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── App Lock ──────────────────────────────────────────────────────────────
  var appLockEnabled = storageGet('hv_app_lock', '0') === '1';

  function setAppLock(on) {
    appLockEnabled = on;
    storageSet('hv_app_lock', on ? '1' : '0');
    renderSettings();
    showToast('App Lock ' + (on ? 'enabled' : 'disabled'));
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  document.getElementById('ver').textContent = VERSION;
  document.getElementById('sysinfo').textContent =
    'Screen: ' + window.innerWidth + 'x' + window.innerHeight + ' | ' + navigator.userAgent.substring(0, 80);

  applyTheme(themeIndex);
  applyAspect(aspectMode);
  initPinKeypad();

  if (appLockEnabled) {
    showScreen('home', true); // show home but don't focus sidebar yet
    // Cover with PIN overlay — if Go Back pressed, try to exit app
    var _appLockBack = document.getElementById('pin-back');
    openPinOverlay(function () {
      // correct PIN — proceed normally
      setTimeout(function () {
        setFocus(document.querySelector('.menu-item[data-screen="home"]'));
      }, 80);
    });
    document.getElementById('pin-title').textContent = 'App Locked — Enter PIN';
    // Override Go Back on launch to exit app
    if (_appLockBack) {
      _appLockBack._appLockExit = true;
    }
  } else {
    showScreen('home');
  }

  setTimeout(function () {
    setFocus(document.querySelector('.menu-item[data-screen="home"]'));
  }, 80);

  // If a playlist was loaded before, reload it silently
  if (loadedPlaylistUrl) {
    xhrGet(loadedPlaylistUrl, function (err, text) {
      if (!err) {
        channels = parseM3u(text);
        filteredChannels = channels.slice();
        updateNowPlayingBar();
      }
    });
  }

})();
