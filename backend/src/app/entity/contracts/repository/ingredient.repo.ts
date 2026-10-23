export type IngredientOutDTO = {
    id: number;
    name: string;
    calories: number|null;
    proteins: number|null;
    fats: number|null;
    carbohydrates: number|null;
}
export type IngredientInDTO = {
    name: string;
    calories: number|null;
    proteins: number|null;
    fats: number|null;
    carbohydrates: number|null;
}


export interface IngredientRepository {
    addIngredient(inDTO: IngredientInDTO): Promise<IngredientOutDTO>; // c
    getIngredient(id: number): Promise<IngredientOutDTO>;
    getIngredientsBySuggestion(partOfName: string): Promise<IngredientOutDTO[]>; // r
    updateIngredient(id: number, inDTO: Partial<IngredientInDTO>): Promise<IngredientOutDTO>; // u
    deleteIngredient(id: number): Promise<void>; // D!!!!
}
