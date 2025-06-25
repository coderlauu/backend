import { SetMetadata } from "@nestjs/common"


export const BYPASS_KEY = Symbol('__bypass_key__')

export function ByPass() {
    return SetMetadata(BYPASS_KEY, true)
}