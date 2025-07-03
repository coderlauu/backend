import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { isEmpty } from 'lodash'
import { Repository, TreeRepository } from 'typeorm'
import { BusinessException } from '~/common/exceptions/biz.exception'
import { ErrorEnum } from '~/constants/error-code.constant'
import { UserEntity } from '~/modules/user/user.entity'
import { deleteEmptyChildren } from '~/utils/list2tree.util'
import { DeptDto, DeptQueryDto } from './dept.dto'
import { DeptEntity } from './dept.entity'

@Injectable()
export class DeptService {
  constructor(
        @InjectRepository(DeptEntity)
        private readonly deptRepository: TreeRepository<DeptEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * 部门列表
   * @param dto 查询条件
   * @returns 部门列表
   */
  async list(dto: DeptQueryDto, uid: number): Promise<DeptEntity[]> {
    const { name } = dto
    const tree: DeptEntity[] = []

    if (name) {
      // 如果有搜索条件，返回扁平列表
      const deptList = await this.deptRepository
        .createQueryBuilder('dept')
        .where('dept.name LIKE :name', { name: `%${name}%` })
        .orderBy('dept.orderNo', 'ASC')
        .getMany()

      for (const dept of deptList) {
        const deptTree = await this.deptRepository.findDescendantsTree(dept)
        tree.push(deptTree)
      }

      deleteEmptyChildren(tree)

      return tree
    }

    const deptTree = await this.deptRepository.findTrees({
      depth: 2,
      relations: ['parent'],
    })

    deleteEmptyChildren(deptTree)

    return deptTree
  }

  /**
   * 新增部门
   * @param dto 部门信息
   */
  async create(dto: DeptDto): Promise<void> {
    const { parentId, ...data } = dto

    // 先把要插入的父级部门查出来
    const parentDept = await this.deptRepository
      .createQueryBuilder('dept')
      .where({ id: parentId })
      .getOne()

    // 再插入新部门
    await this.deptRepository.save({
      ...data,
      parent: parentDept,
    })
  }

  /**
   * 修改部门
   * @param id 部门id
   * @param dto 部门信息
   */
  async update(id: number, { parentId, ...dto }: DeptDto): Promise<void> {
    // 查出当前要修改的部门
    const dept = await this.deptRepository
      .createQueryBuilder('dept')
      .where({ id })
      .getOne()

    // 查出要修改的父级部门
    const parentDept = await this.deptRepository
      .createQueryBuilder('dept')
      .where({ id: parentId })
      .getOne()

    // 修改部门信息
    await this.deptRepository.save({
      ...dept,
      ...dto,
      parent: parentDept,
    })
  }

  /**
   * 删除部门
   * @param id 部门id
   */
  async delete(id: number): Promise<void> {
    await this.deptRepository.delete(id)
  }

  /**
   * 统计部门下用户数量
   * @param id 部门id
   * @returns 用户数量
   */
  async countUserByDeptId(id: number): Promise<number> {
    return await this.userRepository.countBy({ dept: { id } })
  }

  /**
   *
   * @param id
   * @returns
   */
  async countChildDept(id: number): Promise<number> {
    const dept = await this.deptRepository.findOneBy({ id })

    /** 查找当前部门下的子部门数量（包括自己） */
    const count = await this.deptRepository.countDescendants(dept) - 1

    return count
  }

  /**
   * 获取部门详情
   * @param id 部门id
   * @returns 部门详情
   */
  async info(id: number): Promise<DeptEntity> {
    const dept = await this.deptRepository
      .createQueryBuilder('dept')
      .leftJoinAndSelect('dept.parent', 'parent')
      .leftJoinAndSelect('dept.children', 'children')
      .where({ id })
      .getOne()

    if (isEmpty(dept)) {
      throw new BusinessException(ErrorEnum.DEPARTMENT_NOT_FOUND)
    }

    return dept
  }
}
