# HRU — Clipping Routine Prompt

Paste the text below (from the horizontal rule onward) as the prompt when creating the Claude Code Routine.
Replace `TU-USUARIO` with your GitHub username and the email addresses with the actual recipients before saving.

---

## CONFIGURATION (edit before saving)

```
GITHUB_USER = TU-USUARIO
EMAIL_TO = email1@example.com, email2@example.com
REPO = HRU
PAGES_BASE = https://TU-USUARIO.github.io/HRU
```

---

You are running as a Claude Code Routine for the HRU project (Reality Updated – Clipping automático).
This is a fully automated, unattended run. Do not ask questions. Make all decisions yourself following this SOP.

## CONTEXT

HRU is a news-clipping tool for the "Reality Updated" AI news show. Your job is to:
1. Find recent AI/tech news using web search
2. Save the results as structured JSON
3. Update a GitHub Pages site so the editorial team can review the clips
4. Commit and push everything to main
5. Send an email notifying the team

The working directory is the root of this repository.

---

## STEP 1 — Determine today's date

Get today's date in YYYY-MM-DD format. You will use this as FECHA throughout this SOP.

---

## STEP 2 — Run the clipping

Read the file `prompts/clipping.txt`. That file contains the full editorial prompt and instructions for the clipping task.

Using web search, execute the clipping as instructed in that prompt. Find 8–12 real, recent AI and technology news stories from the last 48 hours.

The output must be a valid JSON array following the exact schema specified in `prompts/clipping.txt`.

If the web search returns no useful results or you cannot produce valid JSON, skip to STEP 8 (error email) with the message: "No se pudo completar el clipping: sin resultados de búsqueda."

---

## STEP 3 — Save the clipping result

1. Create the directory `docs/clips/` if it does not exist.
2. Write the JSON array from Step 2 to `docs/clips/FECHA.json` (replacing FECHA with today's date).
   - The file must contain only the raw JSON array, no markdown, no code fences.
   - Validate that the file parses as valid JSON before proceeding. If invalid, abort and go to STEP 8 with error "JSON inválido en el resultado del clipping."

---

## STEP 4 — Update docs/clips/index.json

Read `docs/clips/index.json` if it exists (start with an empty array `[]` if it does not).

The file is a JSON array of edition objects, sorted newest-first. Each object has:
```json
{ "date": "YYYY-MM-DD", "path": "clips/YYYY-MM-DD.json" }
```

- Remove any existing entry for today's date (to avoid duplicates).
- Prepend a new entry for today: `{ "date": "FECHA", "path": "clips/FECHA.json" }`.
- Write the updated array back to `docs/clips/index.json`.

---

## STEP 5 — Create or update docs/index.html

Write (overwrite) `docs/index.html` with the following page. Replace all occurrences of `PAGES_BASE` with the actual GitHub Pages URL configured above.

Requirements:
- Language: Spanish (`lang="es"`)
- Title: "Reality Updated — Archivo de ediciones"
- Simple, readable design (no external CSS frameworks; inline styles only)
- Lists all editions from `docs/clips/index.json`, newest first
- Each edition is a link: text is the date formatted as DD/MM/YYYY, href is `clip-viewer.html?date=YYYY-MM-DD`
- The page fetches `clips/index.json` at runtime via `fetch()` and renders the list dynamically
- If the fetch fails, show a fallback message: "No hay ediciones disponibles aún."
- Color scheme: background `#F5F4F0`, accent `#5B52CC`, font Inter or system sans-serif

The HTML must be self-contained (no build step, no bundler). Use vanilla JS only.

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reality Updated — Archivo de ediciones</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #F5F4F0; color: #1a1a1a; font-family: system-ui, -apple-system, 'Inter', sans-serif; min-height: 100vh; padding: 40px 24px; }
    .container { max-width: 600px; margin: 0 auto; }
    h1 { font-size: 18px; font-weight: 600; letter-spacing: 0.04em; margin-bottom: 8px; }
    .subtitle { color: #888; font-size: 13px; margin-bottom: 36px; }
    .edition-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .edition-list a { display: block; background: #fff; border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 14px 20px; text-decoration: none; color: #111; font-size: 15px; font-weight: 500; transition: border-color 0.15s; }
    .edition-list a:hover { border-color: #5B52CC; color: #5B52CC; }
    .empty { color: #888; font-size: 14px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>REALITY UPDATED</h1>
    <p class="subtitle">Archivo de ediciones de clipping</p>
    <ul class="edition-list" id="list"></ul>
    <p class="empty" id="empty" style="display:none">No hay ediciones disponibles aún.</p>
  </div>
  <script>
    (async () => {
      try {
        const res = await fetch('clips/index.json');
        if (!res.ok) throw new Error('fetch failed');
        const editions = await res.json();
        const list = document.getElementById('list');
        if (!editions.length) { document.getElementById('empty').style.display = ''; return; }
        editions.forEach(({ date }) => {
          const [y, m, d] = date.split('-');
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = `clip-viewer.html?date=${date}`;
          a.textContent = `${d}/${m}/${y}`;
          li.appendChild(a);
          list.appendChild(li);
        });
      } catch {
        document.getElementById('empty').style.display = '';
      }
    })();
  </script>
</body>
</html>
```

Write this file exactly as shown above to `docs/index.html`.

---

## STEP 6 — Create or update docs/clip-viewer.html

Write (overwrite) `docs/clip-viewer.html` with the following viewer page.

Requirements:
- Language: Spanish (`lang="es"`)
- Title: "Reality Updated — Visor de edición"
- Reads the `date` query parameter from the URL
- Fetches `clips/DATE.json` where DATE is the query parameter
- Displays each story as a card showing: headline (bold), summary (paragraph), source (small label), source_url as a "Leer nota →" link
- Each card has a "Marcar como usada" button
  - On click: saves story id to localStorage under key `used_stories_DATE` (a JSON array of ids)
  - If already marked: button says "Usada ✓" and the card gets a muted visual style (opacity 0.5, border color `#d1d5db`)
  - Page loads with already-used stories already styled correctly on mount
- Color scheme: same as index.html (`#F5F4F0` background, `#5B52CC` accent)
- Vanilla JS only, no external dependencies except Google Fonts (Inter) via link tag

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reality Updated — Visor de edición</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #F5F4F0; color: #1a1a1a; font-family: 'Inter', system-ui, sans-serif; min-height: 100vh; padding: 40px 24px; }
    .container { max-width: 720px; margin: 0 auto; }
    .header { margin-bottom: 32px; }
    h1 { font-size: 17px; font-weight: 500; letter-spacing: 0.06em; }
    .date-label { color: #888; font-size: 13px; margin-top: 4px; }
    .back { display: inline-block; color: #888; font-size: 13px; text-decoration: none; margin-bottom: 24px; }
    .back:hover { color: #5B52CC; }
    .stories { display: flex; flex-direction: column; gap: 12px; }
    .card { background: #fff; border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 20px; transition: opacity 0.2s, border-color 0.2s; }
    .card.used { opacity: 0.5; border-color: #d1d5db; }
    .card-headline { font-size: 15px; font-weight: 600; line-height: 1.4; margin-bottom: 8px; }
    .card-summary { font-size: 13px; color: #555; line-height: 1.6; margin-bottom: 10px; }
    .card-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .card-source { font-size: 11px; color: #9ca3af; background: #f3f4f6; padding: 2px 8px; border-radius: 4px; }
    .card-link { font-size: 12px; color: #5B52CC; text-decoration: none; }
    .card-link:hover { text-decoration: underline; }
    .btn-used { margin-left: auto; font-size: 12px; font-weight: 500; padding: 5px 12px; border-radius: 5px; border: 1.5px solid #d1d5db; background: #fff; color: #555; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
    .btn-used:hover:not([data-done]) { border-color: #5B52CC; color: #5B52CC; }
    .btn-used[data-done] { background: #f3f4f6; color: #9ca3af; cursor: default; }
    .error { color: #b91c1c; font-size: 14px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <a class="back" href="index.html">← Todas las ediciones</a>
    <div class="header">
      <h1>REALITY UPDATED</h1>
      <p class="date-label" id="date-label"></p>
    </div>
    <div class="stories" id="stories"></div>
    <p class="error" id="error" style="display:none">No se pudo cargar esta edición.</p>
  </div>
  <script>
    (async () => {
      const params = new URLSearchParams(location.search);
      const date = params.get('date') || '';
      if (!date) { document.getElementById('error').style.display = ''; return; }

      const [y, m, d] = date.split('-');
      document.getElementById('date-label').textContent = `Edición ${d}/${m}/${y}`;
      document.title = `Reality Updated — ${d}/${m}/${y}`;

      const STORAGE_KEY = `used_stories_${date}`;
      const usedSet = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));

      const saveUsed = () => localStorage.setItem(STORAGE_KEY, JSON.stringify([...usedSet]));

      try {
        const res = await fetch(`clips/${date}.json`);
        if (!res.ok) throw new Error('not found');
        const stories = await res.json();
        const container = document.getElementById('stories');

        stories.forEach(story => {
          const id = story.id ?? story.number;
          const isUsed = usedSet.has(id);

          const card = document.createElement('div');
          card.className = 'card' + (isUsed ? ' used' : '');

          const headline = document.createElement('p');
          headline.className = 'card-headline';
          headline.textContent = story.headline;

          const summary = document.createElement('p');
          summary.className = 'card-summary';
          summary.textContent = story.summary || story.what_happened || '';

          const meta = document.createElement('div');
          meta.className = 'card-meta';

          const source = document.createElement('span');
          source.className = 'card-source';
          source.textContent = story.source || '';

          const link = document.createElement('a');
          link.className = 'card-link';
          link.href = story.source_url || '#';
          link.target = '_blank';
          link.rel = 'noopener';
          link.textContent = 'Leer nota →';

          const btn = document.createElement('button');
          btn.className = 'btn-used';
          if (isUsed) { btn.textContent = 'Usada ✓'; btn.setAttribute('data-done', ''); }
          else btn.textContent = 'Marcar como usada';

          btn.addEventListener('click', () => {
            if (btn.hasAttribute('data-done')) return;
            usedSet.add(id);
            saveUsed();
            btn.textContent = 'Usada ✓';
            btn.setAttribute('data-done', '');
            card.classList.add('used');
          });

          meta.appendChild(source);
          if (story.source_url) meta.appendChild(link);
          meta.appendChild(btn);

          card.appendChild(headline);
          card.appendChild(summary);
          card.appendChild(meta);
          container.appendChild(card);
        });
      } catch {
        document.getElementById('error').style.display = '';
      }
    })();
  </script>
</body>
</html>
```

Write this file exactly as shown above to `docs/clip-viewer.html`.

---

## STEP 7 — Commit and push to main

Stage all new and modified files:
```
git add docs/clips/FECHA.json docs/clips/index.json docs/index.html docs/clip-viewer.html
```

Create a commit with the message:
```
chore: clipping FECHA — N noticias

Edición automática del FECHA via Claude Code Routine.
```
(Replace FECHA with today's date and N with the number of stories in the clipping.)

Push to origin main:
```
git push origin main
```

If the push fails (e.g., remote has diverged), try `git pull --rebase origin main` first, then push again. If it still fails, proceed to STEP 8 with error "Falló el push a origin main."

---

## STEP 8 — Send email notification

Use the email MCP tool to send a message.

**If all steps succeeded:**
- To: the EMAIL_TO addresses configured above (comma-separated)
- Subject: `Reality Updated — clipping listo (FECHA)`
- Body (plain text):
  ```
  El clipping del FECHA está listo.

  Ver edición: PAGES_BASE/clip-viewer.html?date=FECHA

  N noticias encontradas. Abrí el link, revisá las historias y marcá las que ya uses en el episodio.

  —
  Reality Updated · Clipping automático
  ```

**If any step failed (error reported in earlier steps):**
- To: the same EMAIL_TO addresses
- Subject: `Reality Updated — ERROR en el clipping (FECHA)`
- Body (plain text):
  ```
  El clipping automático del FECHA encontró un error y no se completó.

  Error: [DESCRIBE EL ERROR AQUÍ]

  Revisá los logs de la Routine en claude.ai/routines para más detalles.

  —
  Reality Updated · Clipping automático
  ```

Replace all placeholders (FECHA, PAGES_BASE, N, EMAIL_TO) with the actual values for this run.

---

## END OF SOP

Do not output anything to stdout beyond what is necessary for file operations and git commands. This is an unattended run.
