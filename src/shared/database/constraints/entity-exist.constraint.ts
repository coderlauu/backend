import { Injectable } from '@nestjs/common'
import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'
import { DataSource, ObjectType, Repository } from 'typeorm'

/**
 * 自定义数据验证约束，用来验证数据库中某条记录是否存在
 * @description 查询某个字段的值是否在数据表中存在
 */
@ValidatorConstraint({ name: 'entityItemExist', async: true })
@Injectable()
export class EntityExistConstraint implements ValidatorConstraintInterface {
  constructor(private dataSource: DataSource) {}

  async validate(value: string, args: ValidationArguments) {
    let repo: Repository<any>
    // 默认对比字段为id
    // 如果表的主键不是id，则需要指定对比字段
    let field = 'id'
    
    if (!value) return true

    const options = args.constraints[0]
    const entity = options.entity

    // 如果传入的是entity，则通过entity获取repository
    if ('entity' in options) {
        field = options.field ?? field
        repo = this.dataSource.getRepository(entity)
    } else {
        // 否则传入的实体类
        repo = this.dataSource.getRepository(options)
    }
    // 查询数据库中是否存在该值
    const item = await repo.findOne({ where: { [field]: value } })
    return !!item
  }

  defaultMessage(args: ValidationArguments) {
    const options = args.constraints[0]
    if (!options) return 'Model not been specified!'
    
    const name = options.name
    return `All instance of ${name} must been exists in database!`
  }
}


/**
 * 数据存在性验证
 * @param entity Entity类或验证条件对象
 * @param validationOptions
 */
function IsEntityExist(
    entity: ObjectType<any>,
    validationOptions?: ValidationOptions,
): (object: Record<string, any>, propertyName: string) => void
  
function IsEntityExist(
    condition: { entity: ObjectType<any>, field?: string },
    validationOptions?: ValidationOptions,
): (object: Record<string, any>, propertyName: string) => void
  
function IsEntityExist(
    condition: ObjectType<any> | { entity: ObjectType<any>, field?: string },
    validationOptions?: ValidationOptions,
): (object: Record<string, any>, propertyName: string) => void {
    return (object: Record<string, any>, propertyName: string) => {
      registerDecorator({
        target: object.constructor,
        propertyName,
        options: validationOptions,
        constraints: [condition],
        validator: EntityExistConstraint,
      })
    }
}
  
export { IsEntityExist }

/** 装饰器定义 */
// 🔍 实际使用示例

// 1. 验证用户是否存在
// 在 DTO 中使用
// export class CreatePostDto {
//     @IsEntityExist(UserEntity)  // 验证 userId 对应的用户是否存在
//     userId: number

//     title: string
//     content: string
//   }

// 2. 验证角色是否存在（自定义字段）
// export class AssignRoleDto {
//     @IsEntityExist({ entity: RoleEntity, field: 'code' })  // 按 code 字段查询
//     roleCode: string
//   }