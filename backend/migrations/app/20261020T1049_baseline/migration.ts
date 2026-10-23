#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/d9d78466502fab974c1669c0c161d62510ec465360651c5bd1e69235d93f9c7f/contract';
import endContract from '../../snapshots/d9d78466502fab974c1669c0c161d62510ec465360651c5bd1e69235d93f9c7f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'Ingredient',
        columns: [
          col('calories', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('carbohydrates', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('fats', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('proteins', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Recipe',
        columns: [
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'RecipeIngredient',
        columns: [
          col('amountGr', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('customAmount', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('customUnit', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('ingredientId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('recipeId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['recipeId', 'ingredientId'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Ingredient',
        constraint: 'Ingredient_name_key',
        columns: ['name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Recipe',
        constraint: 'Recipe_name_key',
        columns: ['name'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'RecipeIngredient',
        index: 'RecipeIngredient_ingredientId_idx_0bb57833',
        columns: ['ingredientId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'RecipeIngredient',
        index: 'RecipeIngredient_recipeId_idx_037d8d32',
        columns: ['recipeId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'RecipeIngredient',
        foreignKey: {
          name: 'RecipeIngredient_ingredientId_fkey',
          columns: ['ingredientId'],
          references: { schema: 'public', table: 'Ingredient', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'RecipeIngredient',
        foreignKey: {
          name: 'RecipeIngredient_recipeId_fkey',
          columns: ['recipeId'],
          references: { schema: 'public', table: 'Recipe', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
