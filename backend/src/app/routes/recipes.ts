import { Hono, type Context } from 'hono';
import { recipeService } from '../services';

const recipesRouter = new Hono();

/** GET /api/recipes/search?q=... */
recipesRouter.get('/search', async (c) => {
  const recipes = await recipeService.searchByName(c.req.query('q'));
  return c.json(recipes);
});

/**
 * Reads selection from either `?ids=1,2` or a JSON body `{ "ids": [1, 2] }`.
 * The documented GET-with-body form remains supported; POST is also accepted
 * for clients/browsers that do not send a body with GET.
 */
async function readIngredientSelection(c: Context): Promise<unknown> {
  const queryIds = c.req.query('ids');
  if (queryIds !== undefined) {
    return { ids: queryIds.split(',').map((id) => id.trim()).filter(Boolean) };
  }

  try {
    return await c.req.json<unknown>();
  } catch {
    // Validation and the corresponding 400 message are kept in RecipeService.
    return undefined;
  }
}

async function searchByIngredients(c: Context) {
  const input = await readIngredientSelection(c);
  const recipes = await recipeService.searchByIngredients(input);
  return c.json(recipes);
}

// Register fixed routes before `/:id`.
recipesRouter.get('/searchByIngredients', searchByIngredients);
recipesRouter.post('/searchByIngredients', searchByIngredients);

/** GET /api/recipes/:id */
recipesRouter.get('/:id', async (c) => {
  const recipe = await recipeService.getById(c.req.param('id'));
  return c.json(recipe);
});

export default recipesRouter;
