const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SUBS_FILE = path.join(DATA_DIR, 'subscribers.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, '[]', 'utf-8');
}
if (!fs.existsSync(SUBS_FILE)) {
  fs.writeFileSync(SUBS_FILE, '[]', 'utf-8');
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8') || '[]');
  } catch (err) {
    return [];
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS headers so devices on network can freely talk to API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqUrl = req.url.split('?')[0];

  // API: Orders
  if (reqUrl === '/api/orders') {
    if (req.method === 'GET') {
      const orders = readJsonFile(ORDERS_FILE);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(orders));
      return;
    }
    if (req.method === 'POST') {
      try {
        const orderData = await getRequestBody(req);
        const orders = readJsonFile(ORDERS_FILE);
        // Avoid duplicate ID if sent twice
        if (!orders.some(o => o.orderId === orderData.orderId)) {
          orders.unshift(orderData);
          writeJsonFile(ORDERS_FILE, orders);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, order: orderData }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
    if (req.method === 'DELETE') {
      writeJsonFile(ORDERS_FILE, []);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
  }

  // API: Subscribers
  if (reqUrl === '/api/subscribers') {
    if (req.method === 'GET') {
      const subs = readJsonFile(SUBS_FILE);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(subs));
      return;
    }
    if (req.method === 'POST') {
      try {
        const subData = await getRequestBody(req);
        const subs = readJsonFile(SUBS_FILE);
        if (!subs.some(s => s.email === subData.email)) {
          subs.unshift(subData);
          writeJsonFile(SUBS_FILE, subs);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, subscriber: subData }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
  }

  // Static File Serving
  if (reqUrl === '/' || reqUrl === '') {
    reqUrl = '/index.html';
  }
  
  const filePath = path.join(__dirname, reqUrl);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
