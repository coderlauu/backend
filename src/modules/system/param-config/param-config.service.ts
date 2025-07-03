import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { paginate } from '~/helper/paginate'
import { Pagination } from '~/helper/paginate/Pagination'
import { ParamConfigDto, ParamConfigQueryDto } from './param-config.dto'
import { ParamConfigEntity } from './param-config.entity'

@Injectable()
export class ParamConfigService {
  constructor(
        @InjectRepository(ParamConfigEntity) private readonly paramConfigRepository: Repository<ParamConfigEntity>,
  ) {}

  /**
   * 新增配置
   * @param dto 配置信息
   */
  async create(dto: ParamConfigDto): Promise<void> {
    await this.paramConfigRepository.insert(dto)
  }

  /**
   * 修改配置
   * @param id 配置id
   * @param dto 配置信息
   */
  async update(id: number, dto: ParamConfigDto): Promise<void> {
    await this.paramConfigRepository.update(id, dto)
  }

  /**
   * 删除配置
   * @param id 配置id
   */
  async delete(id: number): Promise<void> {
    await this.paramConfigRepository.delete(id)
  }

  /**
   * 分页查询
   * @param dto 查询条件
   * @returns 分页数据
   */
  async page(dto: ParamConfigQueryDto): Promise<Pagination<ParamConfigEntity>> {
    const queryBuilder = await this.paramConfigRepository.createQueryBuilder('config')

    if (dto.name) {
      queryBuilder.where('config.name LIKE :name', {
        name: `%${dto.name}%`,
      })
    }

    return paginate(queryBuilder, { page: dto.page, pageSize: dto.pageSize })
  }

  /**
   * 通过id查询配置
   * @param id 配置id
   * @returns 配置信息
   */
  async info(id: number): Promise<ParamConfigEntity> {
    return await this.paramConfigRepository.findOne({ where: { id } })
  }

  /**
   * 通过key查询配置
   */
  async findValueByKey(key: string): Promise<string | null> {
    const result = await this.paramConfigRepository.findOne({
      where: { key },
      select: ['value'],
    })
    console.log('result', result)

    if (result)
      return result.value

    return null
  }
}
