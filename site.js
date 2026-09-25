(function () {
  var root = document.documentElement;

  function apply(lang, persist) {
    window.resolveLanguage.set(lang, persist);
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

  // Refresh restored pages and other open tabs when the shared choice changes.
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) apply(window.resolveLanguage.stored() || root.lang, true);
  });
  window.addEventListener("storage", function (event) {
    if (event.key === "resolve-lang" && (event.newValue === "nl" || event.newValue === "en")) {
      apply(event.newValue, true);
    }
  });

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

  if (root.getAttribute("data-page") !== "service") {
    spy();
    window.addEventListener("scroll", spy, { passive: true });
  }

  // Content stays visible without JavaScript; motion is only an enhancement.
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var entrances = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("arrived");
          entrances.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".service, .principles article").forEach(function (element) {
      entrances.observe(element);
    });
  }
})();
