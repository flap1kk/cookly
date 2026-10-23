export type Ingredient = {
    id: number;
    name: string;
    calories: number|null;
    proteins: number|null;
    fats: number|null;
    carbohydrates: number|null;
    amount?: number;
    customAmount?: number|null;
};