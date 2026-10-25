import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const PORT = 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => {
  fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading index.html');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

wss.on('connection', (socket, req) => {
  const username = new URL(req.url, 'http://localhost').searchParams.get('username');

  const joinMsg = JSON.stringify({ type: 'system', text: `${username} joined` });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(joinMsg);
  });

  socket.on('message', (raw) => {
    try {
      const { username: msgUser, text } = JSON.parse(raw.toString());
      const payload = JSON.stringify({ type: 'chat', username: msgUser, text });
      wss.clients.forEach((client) => {
        if (client.readyState === 1) client.send(payload);
      });
    } catch (e) {}
  });

  socket.on('close', () => {
    const leaveMsg = JSON.stringify({ type: 'system', text: `${username} left` });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(leaveMsg);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Chat server running at http://localhost:${PORT}`);
});