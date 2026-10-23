import { Client } from "pg";

export async function resetDb() {
    const c = new Client({ connectionString: process.env.DATABASE_URL });
    await c.connect();
    await c.query(
        'TRUNCATE "RecipeIngredient", "Recipe", "Ingredient" RESTART IDENTITY CASCADE'
    );
    await c.end();
}