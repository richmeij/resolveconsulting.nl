# Resolve Consulting

Static site for resolveconsulting.nl. Open `index.html`, or serve this folder:

```
python -m http.server 4173
```

The site is in Dutch and English. `language.js` initializes the language before
rendering, using a valid `?lang=nl` or `?lang=en` parameter, then the stored choice,
then the browser preference. Internal page links carry the active language, so
navigation also works when HTML files are opened directly and storage is isolated
per file or unavailable. A manual choice is also saved when browser storage allows it.

The service cards link to `frontend.html`, `backend.html`, and `architectuur.html`.
These pages share `styles.css`, `language.js`, and `site.js`, with Dutch and English content in each
HTML file. Each service page has its own title, description, canonical URL, and Open Graph tags.
Link previews use `assets/og.png` (1200×630). WhatsApp and similar apps read the tags from the HTML
and do not run JavaScript, so the tags in the file are Dutch, matching the default page. `language.js`
updates the title, description, and `og:locale` after a visitor switches language.
The examples are illustrative scenarios, not client cases. No build step is needed.

Run the language navigation regression checks with `node tests/language-navigation.cjs`.
