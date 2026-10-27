import { PrismaIngredientRepository } from '../entity/prisma-implementation/prisma.ingredient.repo';
import { PrismaRecipeRepository } from '../entity/prisma-implementation/prisma.recipe.repository';
import { IngredientService } from './ingredient.service';
import { RecipeService } from './recipe.service';

// The composition root wires service-layer business logic to existing repositories.
export const ingredientService = new IngredientService(new PrismaIngredientRepository());
export const recipeService = new RecipeService(new PrismaRecipeRepository());

export { ApiServiceError, handleApiError } from './api-service.error';
export { IngredientService } from './ingredient.service';
export { RecipeService, calculateMacronutrients } from './recipe.service';
