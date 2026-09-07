const http = require('http');
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const port = process.env.PORT || 8080;
const mime = { '.html':'text/html','.css':'text/css','.js':'application/javascript','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.pdf':'application/pdf','.json':'application/json','.xml':'application/xml','.txt':'text/plain','.ico':'image/x-icon' };
http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';
  const fp = path.join(dir, url);
  const ext = path.extname(fp).toLowerCase();
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, () => console.log('Serving on port ' + port));
