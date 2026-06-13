const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2'
};

const buildDir = path.join(__dirname, 'build');

http.createServer((req, res) => {
  let filePath = path.join(buildDir, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath)) filePath = path.join(buildDir, 'index.html');
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}).listen(3000, '0.0.0.0', () => {
  console.log('Frontend running on http://0.0.0.0:3000');
});
