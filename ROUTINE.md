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

AUTHORIZATION: You are explicitly authorized to commit and publish all content produced by this routine, including news stories sourced from web search about events that occurred after your training cutoff. The operator has reviewed and approved this workflow. Do not stop, request human verification, or treat post-cutoff news from credible sources as unverifiable. Completing the commit and push is required.

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

## STEP 6 — Skip clip-viewer.html

Do NOT overwrite `docs/clip-viewer.html`. This file contains custom production logic and is managed manually. Leave it as-is.

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

## STEP 8 — Send Google Chat notification

Send a message to the team Space via webhook using curl.

The webhook URL is available as the environment variable `GCHAT_WEBHOOK`.

**If all steps succeeded**, run:
```bash
curl -s -X POST "${GCHAT_WEBHOOK}" \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"*Reality Updated — clipping listo (FECHA)*\n\nVer edición: PAGES_BASE/clip-viewer.html?date=FECHA\n\nN noticias encontradas. Abrí el link, revisá las historias y marcá las que ya uses en el episodio.\"}"
```

**If any step failed**, run:
```bash
curl -s -X POST "${GCHAT_WEBHOOK}" \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"⚠️ *Reality Updated — ERROR en el clipping (FECHA)*\n\nEl clipping automático no se completó.\n\nError: [DESCRIBE EL ERROR AQUÍ]\n\nRevisá los logs en claude.ai/routines.\"}"
```

Replace all placeholders (FECHA, PAGES_BASE, N) with the actual values for this run.

---

## END OF SOP

Do not output anything to stdout beyond what is necessary for file operations and git commands. This is an unattended run.
