import type { RecipeOutDTO, RecipeRepository } from '../entity/contracts/repository/recipe.repo';
import { ApiServiceError, runService } from './api-service.error';

export type Macronutrients = {
  // Keep `calroies` exactly as specified in api-doc.txt for compatibility.
  calroies: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type RecipeSearchResponseItem = {
  id: number;
  name: string;
  macronutrients: Macronutrients;
};

export type RecipeDetailsResponse = RecipeSearchResponseItem & {
  description: string;
  ingredients: Array<{
    id: number;
    name: string;
    amountGr: number;
    customUnit: string | null;
    customAmount: number | null;
  }>;
};

const MAX_QUERY_LENGTH = 100;
const MAX_SELECTED_INGREDIENTS = 100;
const NOT_FOUND_MESSAGE = 'Не найдено';

function validateQuery(query: unknown): string {
  if (query !== undefined && typeof query !== 'string') {
    throw new ApiServiceError(400, 'Параметр q должен быть строкой');
  }

  const normalized = typeof query === 'string' ? query.trim() : '';
  if (normalized.length > MAX_QUERY_LENGTH) {
    throw new ApiServiceError(400, `Параметр q не должен превышать ${MAX_QUERY_LENGTH} символов`);
  }

  return normalized;
}

function validateRecipeId(rawId: unknown): number {
  const id = typeof rawId === 'number' ? rawId : Number(rawId);
  // The API contract describes a non-existing/invalid recipe ID as 404.
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ApiServiceError(404, NOT_FOUND_MESSAGE);
  }
  return id;
}

function validateIngredientIds(input: unknown): number[] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ApiServiceError(400, 'Тело запроса должно содержать поле ids — массив ID ингредиентов');
  }

  const rawIds = (input as { ids?: unknown }).ids;
  if (!Array.isArray(rawIds)) {
    throw new ApiServiceError(400, 'Поле ids должно быть массивом положительных целых чисел');
  }

  if (rawIds.length > MAX_SELECTED_INGREDIENTS) {
    throw new ApiServiceError(400, `Можно выбрать не более ${MAX_SELECTED_INGREDIENTS} ингредиентов`);
  }

  const ids = rawIds.map((rawId) => {
    if (typeof rawId === 'number' && Number.isSafeInteger(rawId) && rawId > 0) return rawId;
    if (typeof rawId === 'string' && rawId.trim() !== '') {
      const parsed = Number(rawId);
      if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
    }
    throw new ApiServiceError(400, 'Поле ids должно содержать только положительные целые числа');
  });

  return [...new Set(ids)];
}

function finiteOrZero(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Computes total dish nutrition from each ingredient's per-100g values and its recipe gram amount. */
export function calculateMacronutrients(recipe: RecipeOutDTO): Macronutrients {
  const totals = recipe.ingredients.reduce(
    (total, item) => {
      const factor = finiteOrZero(item.amountGr) / 100;
      total.calroies += finiteOrZero(item.ingredient.calories) * factor;
      total.protein += finiteOrZero(item.ingredient.proteins) * factor;
      total.carbs += finiteOrZero(item.ingredient.carbohydrates) * factor;
      total.fats += finiteOrZero(item.ingredient.fats) * factor;
      return total;
    },
    { calroies: 0, protein: 0, carbs: 0, fats: 0 },
  );

  return {
    calroies: round(totals.calroies),
    protein: round(totals.protein),
    carbs: round(totals.carbs),
    fats: round(totals.fats),
  };
}

function toRecipeSummary(recipe: RecipeOutDTO): RecipeSearchResponseItem {
  return {
    id: recipe.id,
    name: recipe.name,
    macronutrients: calculateMacronutrients(recipe),
  };
}

function toRecipeDetails(recipe: RecipeOutDTO): RecipeDetailsResponse {
  return {
    ...toRecipeSummary(recipe),
    description: recipe.description,
    ingredients: recipe.ingredients.map((item) => ({
      id: item.ingredient.id,
      name: item.ingredient.name,
      amountGr: item.amountGr,
      customUnit: item.customUnit ?? null,
      customAmount: item.customAmount ?? null,
    })),
  };
}

/** Business logic for recipe search, detail DTOs and ingredient-based matching. */
export class RecipeService {
  constructor(private readonly repository: RecipeRepository) {}

  searchByName(rawQuery?: unknown): Promise<RecipeSearchResponseItem[]> {
    return runService('Не удалось выполнить поиск рецептов', async () => {
      const query = validateQuery(rawQuery);
      const recipes = await this.repository.getRecipesByNameSuggestion(query);
      return recipes.map(toRecipeSummary);
    });
  }

  getById(rawId: unknown): Promise<RecipeDetailsResponse> {
    return runService(
      'Не удалось загрузить рецепт',
      async () => {
        const id = validateRecipeId(rawId);
        const recipe = await this.repository.getRecipe(id);
        return toRecipeDetails(recipe);
      },
      { notFoundMessage: NOT_FOUND_MESSAGE },
    );
  }

  searchByIngredients(input: unknown): Promise<RecipeSearchResponseItem[]> {
    return runService('Не удалось подобрать рецепты', async () => {
      const ids = validateIngredientIds(input);
      if (ids.length === 0) return [];

      const recipes = await this.repository.getRecipesByIngredients(ids);
      return recipes.map(toRecipeSummary);
    });
  }
}
