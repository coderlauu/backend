import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { isEmpty } from 'lodash'
import { Repository } from 'typeorm'
import { BusinessException } from '~/common/exceptions/biz.exception'
import { ErrorEnum } from '~/constants/error-code.constant'
import { UserDto } from './dto/user.dto'
import { UserEntity } from './user.entity'

@Injectable()
export class UserService {
  constructor(@InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>) {}
  /**
   * 新增用户
   * @param dto 用户信息
   */
  async create(dto: UserDto): Promise<void> {
    const { username, password, roleIds, deptId, ...data } = dto

    const exists = await this.userRepository.findOneBy({
      username,
    })
    if (!isEmpty(exists)) {
      throw new BusinessException(ErrorEnum.SYSTEM_USER_EXISTS)
    }

    await this.entityManager
  }
}
