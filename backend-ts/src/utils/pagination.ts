export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
  defaultPage?: number;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Safely parses and clamps pagination query parameters (page and limit).
 * Prevents negative values, NaN, and excessive limits that could trigger memory exhaustion or DoS.
 */
export function parsePagination(
  query: { page?: unknown; limit?: unknown } | Record<string, unknown>,
  options: PaginationOptions = {}
): ParsedPagination {
  const defaultLimit = options.defaultLimit ?? 20;
  const maxLimit = options.maxLimit ?? 100;
  const defaultPage = options.defaultPage ?? 1;

  let page = parseInt(String(query?.page ?? defaultPage), 10);
  if (isNaN(page) || page < 1) {
    page = defaultPage;
  }

  let limit = parseInt(String(query?.limit ?? defaultLimit), 10);
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  } else if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
