
import 'dotenv/config';
import XLSX from 'xlsx';
import { Pool, type PoolClient } from 'pg';

const EXCEL_PATH =
  process.env.RECIPES_XLSX_PATH ??
  '/app/content/recipes_import_filled.xlsx';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Не задана переменная DATABASE_URL');
}

type ExcelRow = Record<string, unknown>;

type IngredientRow = {
  name: string;
  calories: number | null;
  proteins: number | null;
  fats: number | null;
  carbohydrates: number | null;
};

type RecipeRow = {
  name: string;
  description: string;
};

type CompositionRow = {
  recipeName: string;
  ingredientName: string;
  amountGr: number;
  customAmount: number | null;
  customUnit: string | null;
};

const pool = new Pool({
  connectionString,
});

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function optionalNumber(
  value: unknown,
  sheet: string,
  rowNumber: number,
  column: string,
): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'string' && !value.trim()) {
    return null;
  }

  const normalized =
    typeof value === 'string'
      ? value.trim().replace(',', '.')
      : value;

  const number = Number(normalized);

  if (!Number.isFinite(number)) {
    throw new Error(
      `Лист «${sheet}», строка ${rowNumber}: ` +
      `некорректное число в колонке «${column}»: ${String(value)}`,
    );
  }

  return number;
}

function requiredNumber(
  value: unknown,
  sheet: string,
  rowNumber: number,
  column: string,
): number {
  const number = optionalNumber(value, sheet, rowNumber, column);

  if (number === null) {
    throw new Error(
      `Лист «${sheet}», строка ${rowNumber}: ` +
      `не заполнена колонка «${column}»`,
    );
  }

  return number;
}

function readSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
): ExcelRow[] {
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(
      `В Excel отсутствует обязательный лист «${sheetName}»`,
    );
  }

  return XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
    defval: null,
    raw: true,
  });
}

function readIngredients(rows: ExcelRow[]): IngredientRow[] {
  const result: IngredientRow[] = [];
  const seen = new Set<string>();

  rows.forEach((row, index) => {
    const name = cleanText(row['Название']);

    // Пустые строки шаблона пропускаем.
    if (!name) return;

    const key = name.toLocaleLowerCase('ru-RU');

    if (seen.has(key)) {
      throw new Error(
        `Лист «Ингредиенты»: повторяется название «${name}»`,
      );
    }

    seen.add(key);

    const rowNumber = index + 2;

    result.push({
      name,
      calories: optionalNumber(
        row['Калории\n(ккал на 100 г)'],
        'Ингредиенты',
        rowNumber,
        'Калории',
      ),
      proteins: optionalNumber(
        row['Белки\n(г на 100 г)'],
        'Ингредиенты',
        rowNumber,
        'Белки',
      ),
      fats: optionalNumber(
        row['Жиры\n(г на 100 г)'],
        'Ингредиенты',
        rowNumber,
        'Жиры',
      ),
      carbohydrates: optionalNumber(
        row['Углеводы\n(г на 100 г)'],
        'Ингредиенты',
        rowNumber,
        'Углеводы',
      ),
    });
  });

  return result;
}

function readRecipes(rows: ExcelRow[]): RecipeRow[] {
  const result: RecipeRow[] = [];
  const seen = new Set<string>();

  rows.forEach((row) => {
    const name = cleanText(row['Название']);
    const description = cleanText(row['Описание']);

    if (!name && !description) return;

    if (!name) {
      throw new Error(
        'Лист «Рецепты»: обнаружена строка с описанием без названия',
      );
    }

    if (!description) {
      throw new Error(
        `Лист «Рецепты»: у рецепта «${name}» нет описания`,
      );
    }

    const key = name.toLocaleLowerCase('ru-RU');

    if (seen.has(key)) {
      throw new Error(
        `Лист «Рецепты»: повторяется название «${name}»`,
      );
    }

    seen.add(key);
    result.push({ name, description });
  });

  return result;
}

function readComposition(
  rows: ExcelRow[],
): CompositionRow[] {
  const result: CompositionRow[] = [];

  rows.forEach((row, index) => {
    const recipeName = cleanText(row['Рецепт']);
    const ingredientName = cleanText(row['Ингредиент']);

    if (!recipeName && !ingredientName) return;

    const rowNumber = index + 2;

    if (!recipeName || !ingredientName) {
      throw new Error(
        `Лист «Состав», строка ${rowNumber}: ` +
        'не указано название рецепта или ингредиента',
      );
    }

    result.push({
      recipeName,
      ingredientName,
      amountGr: requiredNumber(
        row['Количество, г'],
        'Состав',
        rowNumber,
        'Количество, г',
      ),
      customAmount: optionalNumber(
        row['Своё количество\n(целое число)'],
        'Состав',
        rowNumber,
        'Своё количество',
      ),
      customUnit: cleanText(row['Своя единица']) || null,
    });
  });

  return result;
}

async function insertIngredient(
  client: PoolClient,
  ingredient: IngredientRow,
): Promise<number> {
  const result = await client.query<{ id: number }>(
    `
      INSERT INTO "Ingredient"
        ("name", "calories", "proteins", "fats", "carbohydrates")
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT ("name") DO UPDATE SET
        "calories" = EXCLUDED."calories",
        "proteins" = EXCLUDED."proteins",
        "fats" = EXCLUDED."fats",
        "carbohydrates" = EXCLUDED."carbohydrates"
      RETURNING "id"
    `,
    [
      ingredient.name,
      ingredient.calories,
      ingredient.proteins,
      ingredient.fats,
      ingredient.carbohydrates,
    ],
  );

  return result.rows[0].id;
}

async function insertRecipe(
  client: PoolClient,
  recipe: RecipeRow,
): Promise<number> {
  const result = await client.query<{ id: number }>(
    `
      INSERT INTO "Recipe" ("name", "description")
      VALUES ($1, $2)
      ON CONFLICT ("name") DO UPDATE SET
        "description" = EXCLUDED."description"
      RETURNING "id"
    `,
    [recipe.name, recipe.description],
  );

  return result.rows[0].id;
}

async function main(): Promise<void> {
  console.log(`Читаю Excel: ${EXCEL_PATH}`);

  const workbook = XLSX.readFile(EXCEL_PATH);

  const ingredients = readIngredients(
    readSheet(workbook, 'Ингредиенты'),
  );

  const recipes = readRecipes(
    readSheet(workbook, 'Рецепты'),
  );

  const composition = readComposition(
    readSheet(workbook, 'Состав'),
  );

  if (
    ingredients.length === 0 ||
    recipes.length === 0 ||
    composition.length === 0
  ) {
    throw new Error(
      'В Excel отсутствуют ингредиенты, рецепты или состав рецептов',
    );
  }

  const ingredientNames = new Set(
    ingredients.map((item) =>
      item.name.toLocaleLowerCase('ru-RU'),
    ),
  );

  const recipeNames = new Set(
    recipes.map((item) =>
      item.name.toLocaleLowerCase('ru-RU'),
    ),
  );

  // Проверяем ссылки до обращения к базе.
  for (const item of composition) {
    if (
      !recipeNames.has(
        item.recipeName.toLocaleLowerCase('ru-RU'),
      )
    ) {
      throw new Error(
        `В листе «Состав» указан неизвестный рецепт: «${item.recipeName}»`,
      );
    }

    if (
      !ingredientNames.has(
        item.ingredientName.toLocaleLowerCase('ru-RU'),
      )
    ) {
      throw new Error(
        `В листе «Состав» указан неизвестный ингредиент: «${item.ingredientName}»`,
      );
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const ingredientIds = new Map<string, number>();
    const recipeIds = new Map<string, number>();

    for (const ingredient of ingredients) {
      const id = await insertIngredient(client, ingredient);

      ingredientIds.set(
        ingredient.name.toLocaleLowerCase('ru-RU'),
        id,
      );
    }

    for (const recipe of recipes) {
      const id = await insertRecipe(client, recipe);

      recipeIds.set(
        recipe.name.toLocaleLowerCase('ru-RU'),
        id,
      );
    }

    // Пересобираем связи по Excel, чтобы удалённые из файла
    // ингредиенты не оставались в составе существующих рецептов.
    await client.query('DELETE FROM "RecipeIngredient"');

    const insertedLinks = new Set<string>();

    for (const item of composition) {
      const recipeId = recipeIds.get(
        item.recipeName.toLocaleLowerCase('ru-RU'),
      );

      const ingredientId = ingredientIds.get(
        item.ingredientName.toLocaleLowerCase('ru-RU'),
      );

      if (recipeId === undefined || ingredientId === undefined) {
        throw new Error(
          `Не удалось сопоставить рецепт «${item.recipeName}» ` +
          `и ингредиент «${item.ingredientName}»`,
        );
      }

      const linkKey = `${recipeId}:${ingredientId}`;

      if (insertedLinks.has(linkKey)) {
        throw new Error(
          `Повтор ингредиента «${item.ingredientName}» ` +
          `в рецепте «${item.recipeName}». Объедини строки в Excel.`,
        );
      }

      insertedLinks.add(linkKey);

      await client.query(
        `
          INSERT INTO "RecipeIngredient"
            ("recipeId", "ingredientId", "amountGr",
             "customAmount", "customUnit")
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          recipeId,
          ingredientId,
          item.amountGr,
          item.customAmount,
          item.customUnit,
        ],
      );
    }

    await client.query('COMMIT');

    console.log('Импорт Excel завершён успешно.');
    console.log(`Ингредиентов: ${ingredients.length}`);
    console.log(`Рецептов: ${recipes.length}`);
    console.log(`Связей в составе: ${composition.length}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((error: unknown) => {
    console.error('Ошибка импорта Excel:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
