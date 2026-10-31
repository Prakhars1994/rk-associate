// API-only Worker ("rk-associate-api"). The live site is a separate Next.js app on
// Workers; it calls this API cross-origin (bearer token) or via a same-origin route.
import { Hono } from 'hono';
import api from './api/index.js';

const app = new Hono();

app.route('/api', api);
app.get('/', (c) => c.json({ service: 'rk-associate-api', docs: '/api/health' }));
app.all('*', (c) => c.json({ error: 'not_found' }, 404));

export default app;
