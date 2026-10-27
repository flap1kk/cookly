import type { Context } from 'hono';
import { RecordNotFoundException } from '../entity/contracts/repository/repository.exceptions';

export type ApiErrorStatus = 400 | 404 | 500;

/** An expected, safe-to-return API error. Its message is suitable for the client. */
export class ApiServiceError extends Error {
  readonly status: ApiErrorStatus;

  constructor(status: ApiErrorStatus, message: string) {
    super(message);
    this.name = 'ApiServiceError';
    this.status = status;
  }
}

type RunServiceOptions = {
  notFoundMessage?: string;
};

/**
 * Runs a service operation and converts unexpected repository/runtime errors
 * into a predictable Russian-language API message without exposing internals.
 */
export async function runService<T>(
  fallbackMessage: string,
  operation: () => Promise<T> | T,
  options: RunServiceOptions = {},
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (error instanceof ApiServiceError) {
      throw error;
    }

    if (error instanceof RecordNotFoundException && options.notFoundMessage) {
      throw new ApiServiceError(404, options.notFoundMessage);
    }

    // Log the internal exception for developers, but never return its details to clients.
    console.error('Cookly service operation failed:', error);
    throw new ApiServiceError(500, fallbackMessage);
  }
}

/** Last-resort handler for exceptions escaping controllers or middleware. */
export function handleApiError(error: Error, context: Context) {
  if (error instanceof ApiServiceError) {
    return context.json({ message: error.message }, error.status);
  }

  console.error('Unhandled Cookly API exception:', error);
  return context.json({ message: 'Внутренняя ошибка сервера' }, 500);
}

