import { applyDecorators, SetMetadata } from "@nestjs/common"
import { isPlainObject } from "lodash"
import { PERMISSION_KEY } from "../auth.constant"


type TupleToObject<T extends string, U extends ReadonlyArray<string>> = {
    [K in Uppercase<U[number]>]: `${T}:${Lowercase<K>}`
}

type AddPrefixToObjectValue<T extends string, P extends Record<string, string>> = {
    [K in keyof P]: K extends string ? `${T}:${P[K]}` : never
}

/** 定义权限标识的装饰器 */
export function Perm(permission: string | string[]) {
    return applyDecorators(SetMetadata(PERMISSION_KEY, permission))
}

let permissions: string[] = []
/**
 * 定义权限标识，同时收集所有被定义的权限
 * 
 * 通过对象形式定义，eg：
 * ```ts
 * definePermission('app.health', {
 *  NETWORK: 'network'
 * })
 * ```
 * 
 * 通过字符串数组定义，eg：
 * ```ts
 * definePermission('app.health', ['network'])
 * ```
 */
export function definePermission<T extends string, U extends Record<string, string>>(modulePrefix: T, actionMap: U): AddPrefixToObjectValue<T, U>
export function definePermission<T extends string, U extends ReadonlyArray<string>>(modulePrefix: T, actionList: U): TupleToObject<T, U>
export function definePermission(modulePrefix: string, actions) {
    if (isPlainObject(actions)) {
        // 遍历对象，将value与modulePrefix拼接
        Object.entries(actions).forEach(([key, value]) => {
            actions[key] = `${modulePrefix}:${value}`
        })
        // 遍历对象，将拼接好的value添加到permissions中
        const values = Object.values<string>(actions)
        permissions = [...new Set([...permissions, ...values])]
        return actions
    }
    else if (Array.isArray(actions)) {
        // 遍历数组，将每个元素拼接modulePrefix
        const permissionFormats = actions.map(permission => `${modulePrefix}:${permission}`)
        permissions = [...new Set([...permissions, ...permissionFormats])]
        // 将数组中的每个元素转为大写作为对象key，其完整标识作为value
        return actions.reduce((pre, action) => {
            pre[action.toUpperCase()] = `${modulePrefix}:${action}`
            return pre
        }, {})
         
    }
}

export const getDefinePermissions = () => permissions