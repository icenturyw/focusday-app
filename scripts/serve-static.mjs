import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const root = path.resolve(process.argv[2] ?? 'docs-preview');
const port = Number(process.argv[3] ?? 4173);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
};

const server = http.createServer((request, response) => {
  const urlPath = decodeURIComponent((request.url ?? '/').split('?')[0]);
  let targetPath = path.join(root, urlPath === '/' ? 'index.html' : urlPath);

  if (!targetPath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
    targetPath = path.join(targetPath, 'index.html');
  }

  if (!fs.existsSync(targetPath)) {
    const htmlVariant = `${targetPath}.html`;
    if (fs.existsSync(htmlVariant)) {
      targetPath = htmlVariant;
    } else {
      const fallback = path.join(root, urlPath.replace(/^\//, ''), 'index.html');
      if (fs.existsSync(fallback)) {
        targetPath = fallback;
      } else {
        response.writeHead(404);
        response.end('Not found');
        return;
      }
    }
  }

  const ext = path.extname(targetPath).toLowerCase();
  response.writeHead(200, {
    'Content-Type': mimeTypes[ext] ?? 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  fs.createReadStream(targetPath).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});
