const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const path = require('path');

const PORT = process.env.PORT || 3000;
const WEB_USER = process.env.WEB_USER || 'admin';
const WEB_PASSWORD = process.env.WEB_PASSWORD || 'admin123';

if (WEB_PASSWORD === 'admin123') console.warn('WARN: поменяй WEB_PASSWORD!');

const app = express();
function basicAuth(req,res,next){
  const h=req.headers.authorization;
  if(!h||!h.startsWith('Basic ')){ res.setHeader('WWW-Authenticate','Basic realm="VPS"'); return res.status(401).send('Auth required');}
  const [u,p]=Buffer.from(h.slice(6),'base64').toString().split(':');
  if(u===WEB_USER&&p===WEB_PASSWORD) return next();
  res.setHeader('WWW-Authenticate','Basic realm="VPS"'); return res.status(401).send('Wrong');
}
app.use(basicAuth);
app.use(express.static(path.join(__dirname,'public')));
app.get('/health',(req,res)=>res.send('ok - apt работает, делай sudo apt update'));

const server=http.createServer(app);
const wss=new WebSocket.Server({server});
wss.on('connection',(ws,req)=>{
  const h=req.headers.authorization;
  if(!h){ ws.close(1011,'no auth'); return; }
  const [u,p]=Buffer.from(h.slice(6),'base64').toString().split(':');
  if(u!==WEB_USER||p!==WEB_PASSWORD){ ws.close(1011,'bad auth'); return; }
  // ВНИМАНИЕ: root только ВНУТРИ Docker контейнера, не хоста. Защищено WEB_PASSWORD.
  // pty запускается от root контейнера -> apt работает без sudo: apt update && apt install nginx -y
  // На хосте root не дается
  const ptyProc = pty.spawn('bash',[],{name:'xterm-color',cols:80,rows:24,cwd:'/root',env:process.env});
  ptyProc.onData(d=>{try{ws.send(d)}catch{}});
  ws.on('message',m=>{
    try{ const j=JSON.parse(m); if(j.cols&&j.rows){ptyProc.resize(j.cols,j.rows); return;}}catch{}
    ptyProc.write(m.toString());
  });
  ws.on('close',()=>ptyProc.kill());
  ptyProc.onExit(()=>ws.close());
});
server.listen(PORT,()=>console.log(`VPS web console http://localhost:${PORT} user=${WEB_USER}`));
