import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientDirectory = path.resolve(serverDirectory, '../client');

const app = express();

const vite = await createViteServer({
  root: clientDirectory,
  server: { middlewareMode: true },
  appType: 'custom',
});

app.use(vite.middlewares);

app.use('*', async (req, res, next) => {
  try {
    let template = fs.readFileSync(path.resolve(clientDirectory, 'index.html'), 'utf-8');

    const html = template;
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
  } catch (e) {
    // vite.ssrFixStacktrace(e)
    next(e);
  }
});

app.listen(5173);
