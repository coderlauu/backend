import { SetMetadata } from "@nestjs/common"

export const HTTP_IDEMPOTENCE_KEY = Symbol('__idempotence_key__')
export const HTTP_IDEMPOTENCE_OPTIONS = Symbol('__idempotence_options__')

export function Idempotence(options?: any): MethodDecorator {
    return function(target, key, descriptor: PropertyDescriptor) {
        SetMetadata(HTTP_IDEMPOTENCE_OPTIONS, options || {})(descriptor.value)
    }
}