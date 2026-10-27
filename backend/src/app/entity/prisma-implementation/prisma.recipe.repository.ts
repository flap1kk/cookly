import {db} from "../../../prisma/db";
import type {RecipeInDTO, RecipeOutDTO, RecipeRepository} from "../contracts/repository/recipe.repo";
import {RecordNotFoundException} from "../contracts/repository/repository.exceptions";

export class PrismaRecipeRepository implements RecipeRepository {
    async addRecipe(inDTO: RecipeInDTO): Promise<number> {
        const {ingredients, ...recipeFields} = inDTO;
        return await db.transaction(async (trx) => {
            const recipe = await trx.orm.public.Recipe.create(recipeFields);
            await trx.orm.public.RecipeIngredient.createAll(ingredients.map(ingredient => ({recipeId: recipe.id, ...ingredient})));
            return recipe.id
        });
    }

    deleteRecipe(id: number): Promise<void> {
        return db.transaction(async (trx) => {
            await trx.orm.public.RecipeIngredient.where({recipeId: id}).deleteAll()
            await trx.orm.public.Recipe.where({id: id}).delete()
        })
    }

    async getRecipe(id: number): Promise<RecipeOutDTO> {
        const row = await db.orm.public.Recipe
            .where({id: id})
            .include("ingredients", (ig) => ig.include('ingredient'))
            .first();
        if (!row) {
            throw new RecordNotFoundException("Could not find recipe with id");
        }
        return row
    }

    async getRecipesByNameSuggestion(partOfName: string): Promise<RecipeOutDTO[]> {
        return await db.orm.public.Recipe.where((i) => i.name.ilike(`%${partOfName}%`))
            .include("ingredients", (ig) => ig.include('ingredient')).all()
    }

    updateRecipe(id: number, inDTO: Partial<RecipeInDTO>): Promise<RecipeOutDTO> {
        return Promise.resolve({
            id: 1,
            name: '12',
            description: '1241',
            ingredients: []
        }); // TODO: finish(not need now)
    }

    async getRecipesByIngredients(ids: number[]): Promise<RecipeOutDTO[]> {
        if (ids.length === 0) return [];

        // The supplied IDs refer to Ingredient records, not Recipe records.
        // Return recipes sharing at least one selected ingredient and put the
        // recipes with the most matches first to make suggestions more useful.
        const selectedIds = new Set(ids);
        const recipes = await db.orm.public.Recipe
            .include("ingredients", (ig) => ig.include('ingredient'))
            .all();

        return recipes
            .map((recipe) => ({
                recipe,
                matchedIngredients: recipe.ingredients.filter((item) => selectedIds.has(item.ingredient.id)).length,
            }))
            .filter((entry) => entry.matchedIngredients > 0)
            .sort((a, b) => b.matchedIngredients - a.matchedIngredients || a.recipe.id - b.recipe.id)
            .map((entry) => entry.recipe);
    }

    async getRecipesPage(page: number, perPage: number): Promise<RecipeOutDTO[]> {
        return await db.orm.public.Recipe
            .include('ingredients', (ig) => ig.include('ingredient'))
            .orderBy((i) => i.id.asc())
            .offset((page - 1) * perPage)
            .limit(perPage)
            .all()
    }

}