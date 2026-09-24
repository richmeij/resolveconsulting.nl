(function () {
  var key = "resolve-lang";
  var root = document.documentElement;

  function apply(lang, persist) {
    root.lang = lang;
    if (persist) {
      try {
        localStorage.setItem(key, lang);
      } catch (e) {}
    }
    var desc = document.querySelector('meta[name="description"]');
    var text = root.getAttribute("data-desc-" + lang);
    if (desc && text) desc.setAttribute("content", text);
    var buttons = document.querySelectorAll("[data-set-lang]");
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute("data-set-lang") === lang;
      buttons[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  apply(root.lang === "en" ? "en" : "nl", false);

  var buttons = document.querySelectorAll("[data-set-lang]");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function () {
      apply(this.getAttribute("data-set-lang"), true);
    });
  }

  var ids = ["top", "diensten", "aanpak", "contact"];

  function spy() {
    var current = ids[0];
    for (var n = 0; n < ids.length; n++) {
      var el = document.getElementById(ids[n]);
      if (el && el.getBoundingClientRect().top <= 140) current = ids[n];
    }
    var links = document.querySelectorAll("nav a");
    for (var j = 0; j < links.length; j++) {
      if (links[j].getAttribute("href") === "#" + current) {
        links[j].setAttribute("aria-current", "true");
      } else {
        links[j].removeAttribute("aria-current");
      }
    }
  }

  spy();
  window.addEventListener("scroll", spy, { passive: true });
})();
