import type {IngredientInDTO, IngredientOutDTO, IngredientRepository} from "../contracts/repository/ingredient.repo";
import {db} from "../../../prisma/db";
import {RecordNotFoundException} from "./exceptions";


export class PrismaIngredientRepository implements IngredientRepository {
    async addIngredient(inDTO: IngredientInDTO): Promise<IngredientOutDTO> {
        return await db.orm.public.Ingredient.create(inDTO);
    }

    async deleteIngredient(id: number): Promise<void> {
        return await db.transaction(async (trx) => {
            await trx.orm.public.RecipeIngredient.where({recipeId: id}).deleteAll();
            await trx.orm.public.Ingredient.where({id: id}).delete();
        })
    }

    async getIngredient(id: number): Promise<IngredientOutDTO> {
        const row = await db.orm.public.Ingredient.where({id: id}).first();
        if (!row) {
            throw new RecordNotFoundException('Ingredient not found');
        }
        return row;
    }

    async getIngredientsBySuggestion(partOfName: string): Promise<IngredientOutDTO[]> {
        return await db.orm.public.Ingredient
            .where((i) => i.name.ilike(`%${partOfName}%`))
            .all()
    }

    updateIngredient(id: number, inDTO: Partial<IngredientInDTO>): Promise<IngredientOutDTO> {
        return Promise.resolve({ // later
            id: -1,
            name: '12',
            calories: null,
            proteins: null,
            fats: 12,
            carbohydrates: 13
        });
    }


}
