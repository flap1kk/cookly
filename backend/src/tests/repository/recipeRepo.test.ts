import { beforeEach, expect, it } from "vitest";
import { db } from "../../prisma/db";
import { resetDb } from "../db-utils";
import { PrismaRecipeRepository } from "../../app/entity/prisma-implementation/prisma.recipe.repository";
import {PrismaIngredientRepository} from "../../app/entity/prisma-implementation/prisma.ingredient.repo";

const repo = new PrismaRecipeRepository();
const ingrRepo = new PrismaIngredientRepository();
const ingr1 = { name: "Рис", calories: null, proteins: 2.7, fats: 0.3, carbohydrates: 28 };
const ingr2 = { name: "Лосось", calories: 2.5, proteins: 2.1, fats: 0.6, carbohydrates: 23 };

beforeEach(resetDb);

it("adding a new", async () => {
    const a = await ingrRepo.addIngredient(ingr1);
    const b = await ingrRepo.addIngredient(ingr2);
    const inDTO = {
        name: a.name + b.name,
        description: 'adasLosos',
        ingredients: [
            {
                ingredientId: a.id,
                amountGr: 200,
                customAmount: 2,
                customUnit: 'стакана'
            },
            {
                ingredientId: b.id,
                amountGr: 300,
                customAmount: null,
                customUnit: null
            }
        ]
    }
    const cr = await repo.addRecipe(inDTO)
    console.log('Created', cr);
    const qwe = await repo.getRecipesByIngredients([a.id, b.id])
    console.log('Qwe', qwe);
});