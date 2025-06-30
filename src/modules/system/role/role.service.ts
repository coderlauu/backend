import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from './role.entity';
import { Repository } from 'typeorm';
import { isEmpty } from 'lodash';
import { ROOT_ROLE_ID } from '~/constants/system.constant';

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(RoleEntity) private readonly roleRepository: Repository<RoleEntity>
    ) {}

    async getRoleIdsByUser(id: number): Promise<number[]> {
        const roles = await this.roleRepository.find({
            where: {
                users: {
                    id
                }
            }
        })

        if (!isEmpty(roles)) {
            return roles.map(role => role.id)
        }

        return []
    }

    hasAdminRole(roleIds: number[]): boolean {
        return roleIds.includes(ROOT_ROLE_ID)
    }
}
