import { IPaginationMeta } from './interface'
import { Pagination } from './Pagination'

export function createPaginationObject<T>({
  list,
  totalItems,
  currentPage,
  limit,
}: {
  list: T[]
  totalItems?: number
  currentPage: number
  limit: number
}): Pagination<T> {
  const totalPages = totalItems !== undefined ? Math.ceil(totalItems / limit) : undefined

  const meta: IPaginationMeta = {
    totalItems,
    totalPages,
    itemsPerPage: limit,
    itemCount: list.length, // 当前页的实际数据条数
    currentPage,
  }

  return new Pagination<T>(list, meta)
}
