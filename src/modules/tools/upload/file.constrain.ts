import { FastifyMultipartBaseOptions, MultipartFile } from "@fastify/multipart";
import { registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { has, isArray } from "lodash";

/**
 * 文件限制【文件大小、文件数量、文件类型】
 */
type FileLimit = Pick<FastifyMultipartBaseOptions['limits'], 'fileSize' | 'files'> & {
    mimetypes?: string[]
}

/** 文件检查 */
function checkFileAndLimit(file: MultipartFile, limits: FileLimit = {}) {
    // 检查文件是否包含 MIME 类型
    if (!('mimetype' in file)) return false

    // 验证文件类型是否在允许列表中
    if (limits.mimetypes && !limits.mimetypes.includes(file.mimetype)) return false

    // 检查文件大小是否超过限制
    if (has(file, '_buf') && Buffer.byteLength((file as any)._buf) > limits.fileSize) return false

    return true
}

@ValidatorConstraint({ name: 'isFile' })
export class FileConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const [limits = {}] = args.constraints
        const values = (args.object as any)[args.property]
        const filesLimit = (limits as FileLimit).files ?? 0
        if (filesLimit > 0 && isArray(values) && values.length > filesLimit) return false

        return checkFileAndLimit(value, limits)
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return `The file which to upload's conditions are not met`
    }
}

/**
 * 文件限制装饰器
 * @param limits 文件限制
 * @param validationOptions 验证选项
 * @returns 装饰器
 */
export function IsFile(
    limits?: FileLimit,
    validationOptions?: ValidationOptions
) {
    return (object: Record<string, any>, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [limits],
            validator: FileConstraint
        })
    }
}