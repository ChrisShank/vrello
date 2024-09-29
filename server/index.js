import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { renderBoard } from '../shared/templates.js';

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
    const boardHTML = renderBoard({
      id: crypto.randomUUID(),
      name: 'Board 1',
      columns: [
        {
          id: crypto.randomUUID(),
          name: 'Col 1',
          cards: [
            {
              id: crypto.randomUUID(),
              name: 'Card 1.1',
              description: 'Something informative.',
            },
            { id: crypto.randomUUID(), name: 'Card 1.2', description: 'Something else' },
            { id: crypto.randomUUID(), name: 'Card 1.3', description: 'Some thing' },
          ],
        },
        {
          id: crypto.randomUUID(),
          name: 'Col 2',
          cards: [
            { id: crypto.randomUUID(), name: 'Card 2.1', description: 'foo bar' },
            { id: crypto.randomUUID(), name: 'Card 2.2', description: 'foo baz' },
            { id: crypto.randomUUID(), name: 'Card 2.3', description: 'bar bar' },
            { id: crypto.randomUUID(), name: 'Card 2.4', description: 'foo baz bar' },
            { id: crypto.randomUUID(), name: 'Card 2.5', description: 'foo bar' },
            { id: crypto.randomUUID(), name: 'Card 2.6', description: 'foo baz' },
            { id: crypto.randomUUID(), name: 'Card 2.7', description: 'bar bar' },
            { id: crypto.randomUUID(), name: 'Card 2.8', description: 'foo baz bar' },
            { id: crypto.randomUUID(), name: 'Card 2.9', description: 'foo baz bar' },
            { id: crypto.randomUUID(), name: 'Card 2.10', description: 'foo baz bar' },
            { id: crypto.randomUUID(), name: 'Card 2.11', description: 'foo baz bar' },
          ],
        },
        {
          id: crypto.randomUUID(),
          name: 'Col 3',
          cards: [],
        },
      ],
    });

    const html = template.replace('<!-- BODY -->', boardHTML);

    res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
  } catch (e) {
    // vite.ssrFixStacktrace(e)
    next(e);
  }
});

app.listen(5173);
