const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '0.0.0.0';
const port = process.env.PORT || 8000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function buildFallbackReply(message) {
  const input = (message || '').trim().toLowerCase();

  if (input.includes('factor') || input.includes('factoring')) {
    return 'Factoring is like splitting a big expression into smaller friendly pieces. For example, x² + 5x + 6 factors to (x + 2)(x + 3). I can help you with a specific expression too.';
  }

  if (input.includes('quadratic') || input.includes('roots') || input.includes('parabola')) {
    return 'Quadratics are a fun algebra family! They often look like ax² + bx + c, and the solutions come from factoring, completing the square, or the quadratic formula. I can walk through one with you step by step.';
  }

  if (input.includes('solve') || input.includes('equation') || input.includes('=')) {
    return 'I can help solve algebra equations step by step. Share the equation you want to solve, and I will guide you through it in a friendly way.';
  }

  if (input.includes('function') || input.includes('slope')) {
    return 'Functions are like little machines that take an input and give an output. I can explain slope, graphing, or function rules in a fun way.';
  }

  return 'I am Algebra Ace, your playful math tutor. Ask me about algebra, equations, graphs, factoring, or quadratic equations, and I will help you learn.';
}

function readFileSafe(filePath) {
  return fs.readFileSync(filePath);
}

async function callLLM(message) {
  const provider = process.env.LLM_PROVIDER || (process.env.OPENAI_API_KEY ? 'openai' : process.env.OLLAMA_HOST ? 'ollama' : 'fallback');
  const systemPrompt = 'You are Algebra Ace, a cheerful and kid-friendly algebra tutor for students up to Grade 12. Give clear, encouraging explanations and short step-by-step help.';

  if (provider === 'openai') {
    const endpoint = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.8,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message || 'OpenAI request failed');
    }

    return payload.choices?.[0]?.message?.content?.trim() || buildFallbackReply(message);
  }

  if (provider === 'ollama') {
    const host = (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(/\/$/, '');
    const response = await fetch(`${host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        stream: false,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Ollama request failed');
    }

    return payload.message?.content?.trim() || buildFallbackReply(message);
  }

  return buildFallbackReply(message);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'POST' && url.pathname === '/api/chat') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { message } = JSON.parse(body || '{}');
        if (!message || typeof message !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'A message is required.' }));
          return;
        }

        const reply = await callLLM(message);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ reply }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: error.message || 'Unexpected server error.' }));
      }
    });
    return;
  }

  const requestPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const safePath = path.normalize(requestPath).replace(/^\/+/, '');
  const filePath = path.join(process.cwd(), safePath);

  if (!safePath || !fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  try {
    const extension = path.extname(filePath);
    const contentType = MIME_TYPES[extension] || 'application/octet-stream';
    const content = readFileSafe(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error');
  }
});

if (require.main === module) {
  server.listen(port, hostname, () => {
    console.log(`Math tutor server running at http://${hostname}:${port}`);
  });
}

module.exports = { buildFallbackReply };
