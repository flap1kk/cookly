import type { Ingredient } from './ingredient.domain'

export type Recipe = {
    id: number;
    title: string;
    description: string;

    ingredients: Ingredient[];
};
