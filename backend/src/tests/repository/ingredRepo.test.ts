import { beforeEach, expect, it } from "vitest";
import { db } from "../../prisma/db";
import { resetDb } from "../db-utils";
import { PrismaIngredientRepository } from "../../app/entity/prisma-implementation/prisma.ingredient.repo";

const repo = new PrismaIngredientRepository();
const rice = { name: "Рис", calories: null, proteins: 2.7, fats: 0.3, carbohydrates: 28 };

beforeEach(resetDb);

it("search", async () => {
    const created = await repo.addIngredient(rice);
    console.log('created', created);
    console.log(await repo.getIngredientsBySuggestion("рис"))
});