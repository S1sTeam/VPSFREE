const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const WEB_PASSWORD = process.env.WEB_PASSWORD || 'changeme123';
const WEB_USER = process.env.WEB_USER || 'admin';

// ВАЖНО: сервер НЕ запускается от root. Railway и так запускает контейнер от непривилегированного пользователя.
// Повышать до root (sudo su, --allow-root) запрещено ToS и небезопасно.
// Эта консоль работает от имени текущего юзера контейнера.

app.use(express.urlencoded({ extended: true }));

// Простая Basic Auth для всей статики
function basicAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Web Console"');
    return res.status(401).send('Auth required');
  }
  const creds = Buffer.from(auth.slice(6), 'base64').toString();
  const [user, pass] = creds.split(':');
  if (user === WEB_USER && pass === WEB_PASSWORD) {
    return next();
  }
  res.setHeader('WWW-Authenticate', 'Basic realm="Web Console"');
  return res.status(401).send('Wrong password');
}

app.use(basicAuth);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.send('ok'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  // Повторная проверка auth для WS
  const auth = req.headers.authorization;
  if (!auth) {
    ws.close(1011, 'No auth');
    return;
  }
  const creds = Buffer.from(auth.slice(6), 'base64').toString();
  const [user, pass] = creds.split(':');
  if (user !== WEB_USER || pass !== WEB_PASSWORD) {
    ws.close(1011, 'Bad auth');
    return;
  }

  console.log('WS connected');

  // Запускаем shell БЕЗ root: от имени текущего пользователя контейнера
  // НЕ используем sudo, НЕ делаем su
  const shell = process.env.SHELL || 'bash';
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME || '/app',
    env: process.env
  });

  ptyProcess.onData(data => {
    try { ws.send(data); } catch (e) {}
  });

  ws.on('message', msg => {
    // msg может быть JSON для resize, иначе - данные
    try {
      const parsed = JSON.parse(msg);
      if (parsed.cols && parsed.rows) {
        ptyProcess.resize(parsed.cols, parsed.rows);
        return;
      }
    } catch {}
    ptyProcess.write(msg.toString());
  });

  ws.on('close', () => {
    ptyProcess.kill();
    console.log('WS closed');
  });

  ptyProcess.onExit(() => ws.close());
});

server.listen(PORT, () => {
  console.log(`Web console listening on ${PORT}`);
  console.log(`User: ${WEB_USER} | Password set: ${WEB_PASSWORD !== 'changeme123' ? 'yes' : 'NO - CHANGE IT!'}`);
});
