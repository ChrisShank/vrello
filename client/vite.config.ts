import { defineConfig, Plugin } from 'vite';
import { renderBoard } from '../shared/templates';

const indexPlugin: Plugin = {
  name: 'render-index',
  transformIndexHtml(html) {
    const blankBoard = renderBoard({
      id: '',
      name: '',
      columns: [],
    });
    return html.replace('<!-- BODY -->', blankBoard);
  },
};

export default defineConfig({
  plugins: [indexPlugin],
  build: {
    target: 'es2022',
    modulePreload: { polyfill: false },
  },
});
