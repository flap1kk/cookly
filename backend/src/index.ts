import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import recipes from "./app/routes/recipes";
import ingredients from "./app/routes/ingredients";

const app = new Hono().basePath('/api')

app.use(logger())
    .use('/api/*', cors())
    .use(secureHeaders())

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT) || 5000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

app.route('/recipes', recipes).route('/ingredients', ingredients)