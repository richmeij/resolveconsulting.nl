(function () {
  var key = "resolve-lang";
  var root = document.documentElement;

  function valid(value) {
    return value === "nl" || value === "en";
  }

  function storedLanguage() {
    try {
      var value = localStorage.getItem(key);
      return valid(value) ? value : null;
    } catch (e) {
      return null;
    }
  }

  function preferredLanguage() {
    var explicit = new URL(window.location.href).searchParams.get("lang");
    if (valid(explicit)) return explicit;
    var stored = storedLanguage();
    if (stored) return stored;
    var languages = navigator.languages && navigator.languages.length
      ? navigator.languages : [navigator.language || "en"];
    for (var i = 0; i < languages.length; i++) {
      var language = String(languages[i]).toLowerCase().split("-")[0];
      if (valid(language)) return language;
    }
    return "en";
  }

  function setLanguage(lang, persist) {
    if (!valid(lang)) return;
    root.lang = lang;
    var title = root.getAttribute("data-title-" + lang);
    if (title) document.title = title;
    var description = document.querySelector('meta[name="description"]');
    var text = root.getAttribute("data-desc-" + lang);
    if (description && text) description.setAttribute("content", text);
    if (persist) {
      try { localStorage.setItem(key, lang); } catch (e) {}
      // Keep reloads and copied URLs consistent with an explicit selection.
      try {
        var current = new URL(window.location.href);
        current.searchParams.set("lang", lang);
        window.history.replaceState(null, "", current.href);
      } catch (e) {}
    }

    // file:// pages do not reliably share storage. Carry the language in links
    // as well, including when opening a service in a new tab.
    var links = document.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute("href");
      if (!href || href.charAt(0) === "#") continue;
      var target = new URL(href, window.location.href);
      if (target.protocol !== window.location.protocol || target.origin !== window.location.origin) continue;
      if (!/\/(?:index|frontend|backend|architectuur)\.html$/.test(target.pathname) && !target.pathname.endsWith("/")) continue;
      target.searchParams.set("lang", lang);
      // Retain relative links so the same files work locally and when hosted.
      links[i].setAttribute("href", href.split(/[?#]/)[0] + target.search + target.hash);
    }
  }

  window.resolveLanguage = {
    set: setLanguage,
    stored: storedLanguage
  };
  setLanguage(preferredLanguage(), false);
})();
