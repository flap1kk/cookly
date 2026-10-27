import { Hono } from 'hono';
import { ingredientService } from '../services';

const ingredientRouter = new Hono();

/** GET /api/ingredients/search?q=... */
ingredientRouter.get('/search', async (c) => {
  const ingredients = await ingredientService.search(c.req.query('q'));
  return c.json(ingredients);
});

export default ingredientRouter;
