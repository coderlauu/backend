import { IPaginationMeta } from './interface'
import { Pagination } from './pagination'

export function createPaginationObject<T>({
  items,
  totalItems,
  currentPage,
  limit,
}: {
  items: T[]
  totalItems?: number
  currentPage: number
  limit: number
}): Pagination<T> {
  const totalPages = totalItems !== undefined ? Math.ceil(totalItems / limit) : undefined

  const meta: IPaginationMeta = {
    totalItems,
    totalPages,
    itemsPerPage: limit,
    itemCount: items.length, // 当前页的实际数据条数
    currentPage,
  }

  return new Pagination<T>(items, meta)
}
