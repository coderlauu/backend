import { InjectRepository } from "@nestjs/typeorm";
import { DeptDto, DeptQueryDto } from "./dept.dto";
import { DeptEntity } from "./dept.entity";
import { Repository, TreeRepository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { deleteEmptyChildren } from "~/utils/list2tree.util";


@Injectable()
export class DeptService {
    constructor(
        @InjectRepository(DeptEntity)
        private readonly deptRepository: TreeRepository<DeptEntity>
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

            return tree
        }

        const deptTree = await this.deptRepository.findTrees({
            depth: 2,
            relations: ['parent']
        })

        console.log('deptTree', deptTree);
        
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
            parent: parentDept
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

        console.log('dept', dept);

        // 查出要修改的父级部门
        const parentDept = await this.deptRepository
            .createQueryBuilder('dept')
            .where({ id: parentId })
            .getOne()

        console.log('parentDept', parentDept);

        console.log({
            ...dept,
            ...parentDept,
            ...dto,
        });
        

        // 修改部门信息
        await this.deptRepository.save({
            ...dept,
            ...dto,
            ...parentDept,
        })
    }
}