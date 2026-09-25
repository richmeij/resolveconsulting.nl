(function () {
  var section = document.querySelector('.clients');
  if (!section) return;
  var track = section.querySelector('.clients-track');
  var list = section.querySelector('.client-logos');
  var copy = list.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  copy.querySelectorAll('a').forEach(function (link) {
    link.setAttribute('tabindex', '-1');
  });
  track.appendChild(copy);
  section.classList.add('is-animated');
})();
