# HRU — Reality Updated

Herramienta de producción y clipping automático para *Reality Updated*, un noticiero corto de IA y tecnología.

## Qué hace este proyecto

**App local (uso manual):**
- **Clipping** — corre una búsqueda web con Claude para encontrar 8–12 noticias de IA de las últimas 48 horas
- **Scripting** — toma las historias seleccionadas y genera un guion listo para grabar en la voz de Mika
- **Edición** — permite editar frase por frase antes de copiar

**Clipping automático (Routine):**
- Una Claude Code Routine corre el clipping de forma programada, guarda el resultado en `docs/clips/`, actualiza la página pública en GitHub Pages y manda un email con el link. No requiere intervención manual.

## Requisitos

- [Node.js](https://nodejs.org) v18+
- [Claude Code](https://claude.ai/code) instalado y con sesión activa

## Setup local

```bash
cd HRU
npm install
```

## Correr la app local

```bash
node server.js
# abre http://localhost:3001
```

O con recarga automática al guardar:
```bash
npm run dev
```

## Uso

1. Hacé clic en **Run clipping** — Claude busca noticias de IA en la web (tarda 2–10 min)
2. Seleccioná 3–5 historias
3. Hacé clic en **Generate script** — Claude escribe el episodio
4. Editá las frases, luego **Copy full script** o **Copy Mika only**

Para desarrollo sin esperar el clipping real, usá **Load examples** y **Preview script →**.

## Clipping automático

El clipping diario corre automáticamente vía Claude Code Routine configurada en claude.ai.
El resultado queda publicado en GitHub Pages y el equipo recibe un email con el link a la edición.

Para configurar la Routine, seguí el SOP en [ROUTINE.md](ROUTINE.md).
