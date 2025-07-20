import { FindManyOptions, FindOptionsWhere, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm'
import { createPaginationObject } from './create-pagination'
import { IPaginationOptions, PaginationTypeEnum } from './interface'
import { Pagination } from './pagination'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

/**
 * 解析分页选项
 * @param options 分页选项
 * @returns 解析后的分页选项 [page, limit, paginationType]
 */
function resolveOptions(options: IPaginationOptions): [number, number, PaginationTypeEnum] {
  const { page, pageSize, paginationType } = options

  return [
    page || DEFAULT_PAGE,
    pageSize || DEFAULT_LIMIT,
    paginationType || PaginationTypeEnum.LIMIT_AND_OFFSET,
  ]
}

/**
 * 直接使用实体的 Repository 进行分页；
 * 1、简单的单表查询
 * 2、基础的 WHERE 条件过滤
 * @param repository 实体的 Repository
 * @param options 分页选项
 * @param searchOptions 查询条件
 * @returns 分页结果
 */
async function paginateRepository<T>(
  repository: Repository<T>,
  options: IPaginationOptions,
  searchOptions?: FindOptionsWhere<T> | FindManyOptions<T>,
): Promise<Pagination<T>> {
  const [page, limit] = resolveOptions(options)

  const promises: [Promise<T[]>, Promise<number> | undefined] = [
    repository.find({
      skip: (page - 1) * limit,
      take: limit,
      ...searchOptions,
    }),
    repository.count(searchOptions),
  ]

  const [items, total] = await Promise.all(promises)

  return createPaginationObject<T>({
    items,
    totalItems: total,
    currentPage: page,
    limit,
  })
}

/**
 * 使用 QueryBuilder 构建复杂查询后进行分页；
 * 1、复杂的多表关联查询
 * 2、需要 JOIN、GROUP BY 等高级 SQL 操作
 * 3、动态构建查询条件
 * @param queryBuilder QueryBuilder
 * @param options 分页选项
 * @returns 分页结果
 */
async function paginateQueryBuilder<T>(
  queryBuilder: SelectQueryBuilder<T>,
  options: IPaginationOptions,
): Promise<Pagination<T>> {
  const [page, limit, paginationType] = resolveOptions(options)

  if (paginationType === PaginationTypeEnum.TAKE_AND_SKIP) {
    queryBuilder.take(limit).skip((page - 1) * limit) // take：取limit条记录  skip：跳过多少条记录（从头开始数）
  }
  else {
    queryBuilder.limit(limit).offset((page - 1) * limit) // sql语句，同上-> limit == take 、 offset == skip
  }

  const [items, total] = await queryBuilder.getManyAndCount()

  return createPaginationObject<T>({
    items,
    totalItems: total,
    currentPage: page,
    limit,
  })
}

/**
    直接使用实体的 Repository 进行分页
    const users = await paginate(
        userRepository,
        { page: 1, limit: 10 },
        { status: 'active' }  // 简单的查询条件
    )
 */
export async function paginate<T extends ObjectLiteral>(
  repository: Repository<T>,
  options: IPaginationOptions,
  searchOptions?: FindOptionsWhere<T> | FindManyOptions<T>
): Promise<Pagination<T>>
/**
    使用 QueryBuilder 构建复杂查询后进行分页
    const queryBuilder = userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.profile', 'profile')
        .where('user.age > :age', { age: 18 })
        .andWhere('profile.city = :city', { city: '北京' })
 
    const users = await paginate(queryBuilder, { page: 1, limit: 10 })
 */
export async function paginate<T>(
  queryBuilder: SelectQueryBuilder<T>,
  options: IPaginationOptions
): Promise<Pagination<T>>
export async function paginate<T extends ObjectLiteral>(
  repositoryOrQueryBuilder: Repository<T> | SelectQueryBuilder<T>,
  options: IPaginationOptions,
  searchOptions?: FindOptionsWhere<T> | FindManyOptions<T>,
) {
  return repositoryOrQueryBuilder instanceof Repository
    ? paginateRepository<T>(repositoryOrQueryBuilder, options, searchOptions)
    : paginateQueryBuilder<T>(repositoryOrQueryBuilder, options)
}

export async function paginateRaw<T>(
  queryBuilder: SelectQueryBuilder<T>,
  options: IPaginationOptions,
): Promise<Pagination<T>> {
  const [page, limit, paginationType] = resolveOptions(options)

  const promises: [Promise<T[]>, Promise<number> | undefined] = [
    (paginationType === PaginationTypeEnum.LIMIT_AND_OFFSET
      ? queryBuilder.limit(limit).offset((page - 1) * limit)
      : queryBuilder.take(limit).skip((page - 1) * limit)
    ).getRawMany<T>(),
    queryBuilder.getCount(),
  ]

  const [items, total] = await Promise.all(promises)

  return createPaginationObject<T>({
    items,
    totalItems: total,
    currentPage: page,
    limit,
  })
}
