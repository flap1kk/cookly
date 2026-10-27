import type { IngredientRepository } from '../entity/contracts/repository/ingredient.repo';
import { ApiServiceError, runService } from './api-service.error';

export type IngredientSearchResponseItem = {
  id: number;
  name: string;
};

const MAX_QUERY_LENGTH = 100;

function validateQuery(query: unknown): string {
  if (query !== undefined && typeof query !== 'string') {
    throw new ApiServiceError(400, 'Параметр q должен быть строкой');
  }

  const normalized = typeof query === 'string' ? query.trim() : '';
  if (normalized.length > MAX_QUERY_LENGTH) {
    throw new ApiServiceError(400, `Параметр q не должен превышать ${MAX_QUERY_LENGTH} символов`);
  }

  return normalized;
}

/** Business logic for ingredient search. The HTTP controller never calls a repository directly. */
export class IngredientService {
  constructor(private readonly repository: IngredientRepository) {}

  search(rawQuery?: unknown): Promise<IngredientSearchResponseItem[]> {
    return runService('Не удалось выполнить поиск ингредиентов', async () => {
      const query = validateQuery(rawQuery);
      const ingredients = await this.repository.getIngredientsBySuggestion(query);

      // Prepare the public API DTO; database nutrition columns stay internal here.
      return ingredients.map(({ id, name }) => ({ id, name }));
    });
  }
}
