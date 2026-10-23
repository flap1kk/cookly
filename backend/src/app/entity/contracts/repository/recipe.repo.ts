import type {IngredientOutDTO} from "./ingredient.repo";

type RecipeIngredientOutDTO = {
    ingredient: IngredientOutDTO;
    amountGr: number;
    customAmount: number|null;
    customUnit: string|null;
}

type RecipeIngredientInDTO = {
    ingredientId: number;
    amountGr: number;
    customAmount: number|null;
    customUnit: string | null;
}

export type RecipeOutDTO = {
    id: number;
    name: string;
    description: string;
    ingredients: RecipeIngredientOutDTO[];
}

export type RecipeInDTO = {
    name: string;
    description: string;
    ingredients: RecipeIngredientInDTO[];
}

export interface RecipeRepository {  // TODO: Implement this
    addRecipe(inDTO: RecipeInDTO): Promise<number>;
    getRecipe(id: number): Promise<RecipeOutDTO>;
    getRecipesByNameSuggestion(partOfName: string): Promise<RecipeOutDTO[]>;
    getRecipesPage(page: number, perPage: number): Promise<RecipeOutDTO[]>;
    getRecipesByIngredients(ids: number[]): Promise<RecipeOutDTO[]>;
    updateRecipe(id: number, inDTO: Partial<RecipeInDTO>): Promise<RecipeOutDTO>;
    deleteRecipe(id: number): Promise<void>;
}