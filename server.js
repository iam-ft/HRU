import express from 'express';
import { spawn } from 'child_process';
import { readFileSync, writeFileSync, readdirSync, accessSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

function loadPrompt(filename) {
  const filepath = join(__dirname, 'prompts', filename);
  try {
    return readFileSync(filepath, 'utf-8');
  } catch (e) {
    console.error(`[startup] Missing prompt file: ${filepath}`);
    process.exit(1);
  }
}

const CLIPPING_PROMPT = loadPrompt('clipping.txt');
const SCRIPT_PROMPT = loadPrompt('script.txt');

function findClaudeBin() {
  const base = `${process.env.HOME}/Library/Application Support/Claude/claude-code`;
  try {
    const versions = readdirSync(base).sort().reverse();
    for (const v of versions) {
      const p = `${base}/${v}/claude.app/Contents/MacOS/claude`;
      try { accessSync(p); return p; } catch {}
    }
  } catch {}
  return 'claude'; // fallback: hope it's in PATH
}
const CLAUDE_BIN = findClaudeBin();
console.log('[claude] bin:', CLAUDE_BIN);

function runClaude(prompt, callback, timeoutMs = 600000) {
  const startedAt = Date.now();
  console.log('[claude] spawning, prompt length:', prompt.length);
  const child = spawn(CLAUDE_BIN, ['--print', '--dangerously-skip-permissions', prompt], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '', stderr = '', done = false;

  const timer = setTimeout(() => {
    if (!done) {
      done = true;
      child.kill();
      callback(new Error('timeout after ' + timeoutMs / 1000 + 's'), stdout, stderr);
    }
  }, timeoutMs);

  child.stdout.on('data', d => { stdout += d; });
  child.stderr.on('data', d => { stderr += d; });
  child.on('error', err => {
    if (!done) { done = true; clearTimeout(timer); callback(err, '', ''); }
  });
  child.on('close', code => {
    if (!done) {
      done = true;
      clearTimeout(timer);
      console.log('[claude] done, code:', code, '| stdout len:', stdout.length, '| stderr len:', stderr.length);
      if (stderr) console.error('[claude] stderr:', stderr.slice(0, 500));
      console.log('[claude] stdout preview:', stdout.slice(0, 300));
      if (code !== 0) callback(new Error(`exit ${code}`), stdout, stderr);
      else callback(null, stdout, stderr);
    }
  });
}

function extractJSON(text) {
  const objMatch = text.match(/\{[\s\S]*\}/);
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (objMatch && arrMatch) {
    return objMatch.index <= arrMatch.index ? objMatch[0] : arrMatch[0];
  }
  if (objMatch) return objMatch[0];
  if (arrMatch) return arrMatch[0];
  return text;
}

// Serve example data for UI development/testing
app.get('/api/example-clips', (req, res) => {
  const data = readFileSync(join(__dirname, 'data/example-clips.json'), 'utf-8');
  res.json(JSON.parse(data));
});

app.get('/api/example-script', (req, res) => {
  const data = readFileSync(join(__dirname, 'data/example-script.json'), 'utf-8');
  res.json(JSON.parse(data));
});

// Real clipping — runs Claude Code with web search
app.post('/api/clip', (req, res) => {
  runClaude(CLIPPING_PROMPT, (err, stdout, stderr) => {
    if (err) {
      console.error('[clip] Claude error:', err.message);
      console.error('[clip] stderr:', stderr);
      console.error('[clip] stdout:', stdout);
      return res.status(500).json({ error: 'Claude failed', detail: stderr || err.message, stdout });
    }
    try {
      const json = extractJSON(stdout);
      const stories = JSON.parse(json);
      writeFileSync(join(__dirname, 'data/clips.json'), JSON.stringify(stories, null, 2));
      res.json(stories);
    } catch (e) {
      console.error('Parse error:', e, '\nRaw output:', stdout);
      res.status(500).json({ error: 'Could not parse Claude output', raw: stdout });
    }
  });
});

// Real scripting — runs Claude Code with selected stories
app.post('/api/script', (req, res) => {
  const { stories } = req.body;
  if (!stories || !stories.length) {
    return res.status(400).json({ error: 'No stories provided' });
  }
  const prompt = `${SCRIPT_PROMPT}\n\nSelected stories:\n${JSON.stringify(stories, null, 2)}`;
  runClaude(prompt, (err, stdout, stderr) => {
    if (err) {
      console.error('Claude error:', stderr);
      return res.status(500).json({ error: 'Claude failed', detail: stderr });
    }
    try {
      const json = extractJSON(stdout);
      const script = JSON.parse(json);
      writeFileSync(join(__dirname, 'data/script.json'), JSON.stringify(script, null, 2));
      res.json(script);
    } catch (e) {
      console.error('Parse error:', e, '\nRaw output:', stdout);
      res.status(500).json({ error: 'Could not parse Claude output', raw: stdout });
    }
  });
});

const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log(`HRU running at http://localhost:${PORT}`);
});
server.timeout = 660000; // 11 min — clipping web search takes 8–12 min
