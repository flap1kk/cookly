import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import recipes from './app/routes/recipes';
import ingredients from './app/routes/ingredients';
import { handleApiError } from './app/services';

const app = new Hono().basePath('/api');

app.use('*', logger());
app.use('*', cors());
app.use('*', secureHeaders());

// Central fallback: service errors return safe text messages, unexpected errors are hidden.
app.onError((error, c) => handleApiError(error, c));

app.get('/health', (c) => c.json({ status: 'ok' }));
app.route('/recipes', recipes);
app.route('/ingredients', ingredients);

const port = Number(process.env.PORT) || 3000;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Cookly API is running on http://localhost:${info.port}/api`);
});
