(function () {
  "use strict";

  var c = window.SITE_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  // Built-in icons. Trusted markup, so innerHTML is safe here.
  var ICONS = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r=".7" fill="currentColor" stroke="none"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.26 0 .5.04.73.11V9.7a5.7 5.7 0 0 0-.73-.05 5.7 5.7 0 1 0 5.7 5.7V8.9a7.4 7.4 0 0 0 4.32 1.38V7.2a4.3 4.3 0 0 1-3.2-1.38z"/></svg>',
    snapchat: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c-2.8 0-4.8 2.1-4.8 4.9v2.3c-.6.2-1.4.4-2.2.5-.4.1-.5.6-.2.9.8.7 1.9 1.2 2.9 1.4-.2.9-.6 1.6-1.4 2.1-.4.2-.2.8.2.9 1 .2 1.7.4 2.4.8.2.6.9 1.3 2.1 1.3 1.6 0 2.1-.7 2.4-1.2.3.5.8 1.2 2.4 1.2 1.2 0 1.9-.7 2.1-1.3.7-.4 1.4-.6 2.4-.8.4-.1.6-.7.2-.9-.8-.5-1.2-1.2-1.4-2.1 1-.2 2.1-.7 2.9-1.4.3-.3.2-.8-.2-.9-.8-.1-1.6-.3-2.2-.5V6.9C16.8 4.1 14.8 2 12 2z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.5 4.2 18.3 19.4c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.6 13.6 1.8 12.1c-1-.3-1-1 .2-1.5L20.3 3.5c.8-.3 1.6.2 1.2 1.7z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/></svg>'
  };

  // Only allow web and mail protocols from config
  function safeUrl(url) {
    try {
      var u = new URL(url, window.location.href);
      return ["https:", "http:", "mailto:"].indexOf(u.protocol) !== -1 ? u.href : null;
    } catch (e) { return null; }
  }

  // Language and direction
  var isRTL = ["ar", "fa", "he", "ur"].indexOf(c.lang) !== -1;
  document.documentElement.lang = c.lang || "en";
  document.documentElement.dir = isRTL ? "rtl" : "ltr";
  if (c.name) document.title = c.name;

  // Background: fades in once loaded. If it is missing, the body colour remains.
  var bg = $("bg");
  if (c.background) {
    bg.addEventListener("load", function () {
      document.body.classList.add("bg-ready");
    });
    bg.src = c.background;
  }

  // Profile
  var avatar = $("avatar");
  if (c.avatar) {
    avatar.src = c.avatar;
    avatar.alt = (c.name || "Profile") + " photo";
  } else {
    avatar.hidden = true;
  }

  $("name").textContent = c.name || "";

  var bioEl = $("bio");
  String(c.bio || "").split(/\n+/).forEach(function (line) {
    if (!line.trim()) return;
    var p = document.createElement("p");
    p.textContent = line.trim();
    bioEl.appendChild(p);
  });

  // Links
  var nav = $("links");
  var items = (c.socials || []).concat(c.extraLinks || []).filter(function (item) {
    return item && item.url && safeUrl(item.url);
  });

  items.forEach(function (item, i) {
    var a = document.createElement("a");
    a.className = "link";
    a.href = safeUrl(item.url);
    a.target = "_blank";
    a.rel = "noopener noreferrer me";
    a.style.setProperty("--i", i);

    var ico = document.createElement("span");
    ico.className = "ico";
    ico.innerHTML = ICONS[item.platform] || ICONS.link;

    var label = document.createElement("span");
    label.className = "label";
    label.textContent = item.label || item.platform;

    a.appendChild(ico);
    a.appendChild(label);
    nav.appendChild(a);
  });

  $("foot").textContent = c.footer || "";
})();
