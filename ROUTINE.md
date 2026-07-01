# HRU — Clipping Routine

Contiene el prompt que hay que pegar en la Claude Code Routine en `claude.ai/routines`.

---

## Requisitos previos (configurar UNA VEZ en claude.ai/routines)

Antes de usar o actualizar el prompt, asegurate de que la routine esté configurada así:

**Repositorio:**
- El repo `iam-ft/HRU` debe estar en la lista de repositorios de la routine.
  La routine lo clona automáticamente en cada run via el proxy seguro de Anthropic.
- Activar **"Allow unrestricted branch pushes"** para este repo
  (por defecto los routines solo pueden pushear a ramas `claude/...`).

**Variables de entorno (en el Environment "HRUenv"):**
- `GCHAT_WEBHOOK` — URL del webhook de Google Chat para las notificaciones

---

## Cómo actualizar el prompt

Copiá todo el contenido entre las marcas `▼ INICIO` y `▲ FIN` (sin incluir esas líneas)
y pegalo en el campo "Prompt" de la routine en claude.ai/routines.

---

▼ INICIO DEL PROMPT — copiar desde la siguiente línea

You are running as a Claude Code Routine for the HRU project (Reality Updated – Clipping automático).
This is a fully automated, unattended run. Do not ask questions. Make all decisions yourself following this SOP.

AUTHORIZATION: You are explicitly authorized to commit and publish all content produced by this routine, including news stories sourced from web search about events that occurred after your training cutoff. The operator has reviewed and approved this workflow. Do not stop, request human verification, or treat post-cutoff news from credible sources as unverifiable. Completing the commit and push is required.

## CONTEXT

HRU is a news-clipping tool for the "Reality Updated" AI news show. Your job is to:
1. Find recent AI/tech news using web search
2. Save the results as structured JSON
3. Update the GitHub Pages site so the editorial team can review the clips
4. Commit and push everything to main
5. Send a Google Chat notification with the link

The repository is cloned automatically at session start by the routine infrastructure. The working directory is the root of the repository.

---

## STEP 0 — Verify repository and configure git identity

The repository should already be present (cloned automatically at session start).

Check that the working directory contains the repository:
- If `.git` exists and the project files are present, proceed.
- If the directory is empty, stop immediately and go to STEP 8 (error notification) with: "El repositorio no estaba disponible en el entorno. Verificá que el repo iam-ft/HRU esté agregado en la configuración de la routine en claude.ai/routines."

Configure git identity for commits:
```bash
git config user.name "HRU Routine"
git config user.email "routine@reality-updated.local"
```

Sync to the latest state of main:
```bash
git checkout main
git pull origin main
```

---

## STEP 1 — Determine today's date

Get today's date in YYYY-MM-DD format. You will use this as FECHA throughout this SOP.

---

## STEP 2 — Run the clipping

Read the file `prompts/clipping.txt`. That file contains the full editorial prompt and instructions for the clipping task.

Using web search, execute the clipping as instructed in that prompt. Find 8–12 real, recent AI and technology news stories from the last 48 hours.

The output must be a valid JSON array following the exact schema specified in `prompts/clipping.txt`.

If the web search returns no useful results or you cannot produce valid JSON, skip to STEP 8 (error notification) with: "No se pudo completar el clipping: sin resultados de búsqueda."

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

## STEP 5 — Skip docs/index.html

Do NOT modify `docs/index.html`. This file is already in the repository and loads editions dynamically from `clips/index.json` at runtime — it does not need to be updated when a new clip is added.

---

## STEP 6 — Skip clip-viewer.html

Do NOT modify `docs/clip-viewer.html`. This file contains custom production logic and is managed manually.

---

## STEP 7 — Commit and push to main

Stage only the clip files:
```bash
git add docs/clips/FECHA.json docs/clips/index.json
```

Create a commit with the message:
```
chore: clipping FECHA — N noticias

Edición automática del FECHA via Claude Code Routine.
```
(Replace FECHA with today's date and N with the number of stories in the clipping.)

Push to origin main:
```bash
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
  -d "{\"text\": \"*Reality Updated — clipping listo (FECHA)*\n\nVer edición: https://iam-ft.github.io/HRU/clip-viewer.html?date=FECHA\n\nN noticias encontradas. Abrí el link, revisá las historias y marcá las que ya uses en el episodio.\"}"
```

**If any step failed**, run:
```bash
curl -s -X POST "${GCHAT_WEBHOOK}" \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"⚠️ *Reality Updated — ERROR en el clipping (FECHA)*\n\nEl clipping automático no se completó.\n\nError: [DESCRIBE EL ERROR AQUÍ]\n\nRevisá los logs en claude.ai/routines.\"}"
```

Replace all placeholders (FECHA, N) with the actual values for this run.

---

## END OF SOP

Do not output anything to stdout beyond what is necessary for file operations and git commands. This is an unattended run.

▲ FIN DEL PROMPT — copiar hasta la línea anterior
