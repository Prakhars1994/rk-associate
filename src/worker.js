// Entry point: /api/* goes to the Hono API, everything else to the page renderers.
// Pages live in src/index.js (owned by the frontend work); keep this file thin.
import { Hono } from 'hono';
import api from './api/index.js';
import pages from './index.js';

const app = new Hono();

app.route('/api', api);
app.all('/api/*', (c) => c.json({ error: 'not_found' }, 404));
app.all('*', (c) => pages.fetch(c.req.raw, c.env, c.executionCtx));

export default app;
