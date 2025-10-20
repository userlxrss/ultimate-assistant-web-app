import { PaginationMeta } from '@/types';

export function paginationHelper(
  page: number,
  limit: number,
  total: number
): { skip: number; take: number; paginationMeta: PaginationMeta } {
  const skip = (page - 1) * limit;
  const take = limit;

  const totalPages = Math.ceil(total / limit);

  const paginationMeta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };

  return { skip, take, paginationMeta };
}

export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}