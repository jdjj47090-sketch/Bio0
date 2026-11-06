(function () {
  "use strict";

  // ===== Settings: change only if your repo is different =====
  var OWNER = "jdjj47090-sketch";
  var REPO = "Bio0";
  var BRANCH = "main";
  var CONFIG_PATH = "js/config.js";
  var TOKEN_KEY = "bio_admin_token";
  var MAX_IMAGE_BYTES = 900 * 1024;
  var API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/";

  var PLATFORMS = [
    ["instagram", "Instagram"],
    ["tiktok", "TikTok"],
    ["snapchat", "Snapchat"],
    ["telegram", "Telegram"],
    ["link", "رابط عام"]
  ];

  var $ = function (id) { return document.getElementById(id); };
  var state = JSON.parse(JSON.stringify(window.SITE_CONFIG || {}));
  state.socials = state.socials || [];
  state.extraLinks = state.extraLinks || [];

  // ----- Token -----
  var tokenInput = $("token");
  var remember = $("remember");
  var savedToken = localStorage.getItem(TOKEN_KEY);
  if (savedToken) {
    tokenInput.value = savedToken;
    remember.checked = true;
  }
  function token() { return tokenInput.value.trim(); }

  // ----- UI helpers -----
  var toastTimer;
  function toast(msg, isError) {
    var t = $("toast");
    t.textContent = msg;
    t.className = "toast show" + (isError ? " error" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "toast"; }, 4000);
  }

  function busy(on) {
    document.querySelectorAll("button").forEach(function (b) { b.disabled = on; });
  }

  // ----- Encoding -----
  function toBase64(bytes) {
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function textToBase64(text) {
    return toBase64(new TextEncoder().encode(text));
  }

  // ----- GitHub API -----
  function gh(path, method, body) {
    return fetch(API + path, {
      method: method || "GET",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer " + token(),
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (res) {
      if (res.status === 404) return { notFound: true };
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.message || ("HTTP " + res.status));
        return data;
      });
    });
  }

  // Creates the file, or updates it if it already exists
  function commitFile(path, content64, message) {
    return gh(path).then(function (existing) {
      var body = { message: message, content: content64, branch: BRANCH };
      if (!existing.notFound) body.sha = existing.sha;
      return gh(path, "PUT", body);
    });
  }

  // ----- Save config -----
  function saveConfig() {
    if (!token()) { toast("أدخل رمز GitHub أولاً", true); return; }
    if (remember.checked) localStorage.setItem(TOKEN_KEY, token());
    else localStorage.removeItem(TOKEN_KEY);

    var file = "/* Personal info. Edited from the admin panel. */\n" +
               "window.SITE_CONFIG = " + JSON.stringify(state, null, 2) + ";\n";

    busy(true);
    toast("جاري الحفظ...");
    commitFile(CONFIG_PATH, textToBase64(file), "Update profile from admin panel")
      .then(function () {
        toast("تم الحفظ. يظهر التحديث على الموقع خلال دقيقة تقريباً.");
      })
      .catch(function (e) {
        toast("فشل الحفظ: " + e.message, true);
      })
      .then(function () { busy(false); });
  }

  // ----- Image upload -----
  function uploadImage(file, key) {
    if (!file) return;
    if (!token()) { toast("أدخل رمز GitHub أولاً", true); return; }
    if (file.size > MAX_IMAGE_BYTES) {
      toast("الصورة أكبر من 900KB. صغّرها أولاً من squoosh.app", true);
      return;
    }
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    var path = "images/" + key + "-" + Date.now() + "." + ext;

    var reader = new FileReader();
    reader.onload = function () {
      busy(true);
      toast("جاري رفع الصورة...");
      commitFile(path, toBase64(new Uint8Array(reader.result)), "Upload " + key + " image")
        .then(function () {
          state[key] = path;
          $(key).value = path;
          toast("تم رفع الصورة. اضغط حفظ لتطبيقها.");
        })
        .catch(function (e) {
          toast("فشل الرفع: " + e.message, true);
        })
        .then(function () { busy(false); });
    };
    reader.readAsArrayBuffer(file);
  }

  // ----- Link lists -----
  function button(text, title, onClick) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "small";
    b.textContent = text;
    b.title = title;
    b.addEventListener("click", onClick);
    return b;
  }

  function input(placeholder, value, onInput) {
    var el = document.createElement("input");
    el.placeholder = placeholder;
    el.value = value || "";
    el.addEventListener("input", function () { onInput(el.value); });
    return el;
  }

  function renderList(key, boxId, withPlatform) {
    var list = state[key];
    var box = $(boxId);
    box.innerHTML = "";

    list.forEach(function (item, i) {
      var row = document.createElement("div");
      row.className = "row";

      if (withPlatform) {
        var sel = document.createElement("select");
        PLATFORMS.forEach(function (p) {
          var o = document.createElement("option");
          o.value = p[0];
          o.textContent = p[1];
          if (item.platform === p[0]) o.selected = true;
          sel.appendChild(o);
        });
        sel.addEventListener("change", function () { item.platform = sel.value; });
        row.appendChild(sel);
      }

      row.appendChild(input("الاسم الظاهر", item.label, function (v) { item.label = v; }));
      row.appendChild(input("https://... (اتركه فارغاً لإخفاء الزر)", item.url, function (v) { item.url = v; }));

      var ctrl = document.createElement("div");
      ctrl.className = "ctrl";
      ctrl.appendChild(button("أعلى", "نقل لأعلى", function () {
        if (i > 0) { list.splice(i - 1, 0, list.splice(i, 1)[0]); renderLists(); }
      }));
      ctrl.appendChild(button("أسفل", "نقل لأسفل", function () {
        if (i < list.length - 1) { list.splice(i + 1, 0, list.splice(i, 1)[0]); renderLists(); }
      }));
      ctrl.appendChild(button("حذف", "حذف", function () {
        list.splice(i, 1);
        renderLists();
      }));
      row.appendChild(ctrl);

      box.appendChild(row);
    });
  }

  function renderLists() {
    renderList("socials", "social-list", true);
    renderList("extraLinks", "extra-list", false);
  }

  // ----- Bind simple fields -----
  function bind(id, key) {
    var el = $(id);
    el.value = state[key] || "";
    var update = function () { state[key] = el.value; };
    el.addEventListener("input", update);
    el.addEventListener("change", update);
  }

  bind("name", "name");
  bind("bio", "bio");
  bind("footer", "footer");
  bind("lang", "lang");
  bind("avatar", "avatar");
  bind("background", "background");

  $("avatar-file").addEventListener("change", function (e) {
    uploadImage(e.target.files[0], "avatar");
    e.target.value = "";
  });
  $("background-file").addEventListener("change", function (e) {
    uploadImage(e.target.files[0], "background");
    e.target.value = "";
  });

  $("add-social").addEventListener("click", function () {
    state.socials.push({ platform: "instagram", label: "", url: "" });
    renderLists();
  });
  $("add-extra").addEventListener("click", function () {
    state.extraLinks.push({ platform: "link", label: "", url: "" });
    renderLists();
  });

  $("save").addEventListener("click", saveConfig);

  renderLists();
})();
