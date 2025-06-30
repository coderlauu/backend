import { MenuEntity } from "~/modules/system/menu/menu.entity";
import { isExternal } from "./is.util";
import { uniqueSlash } from "./tool.util";

/**
 * 定义菜单数据结构
 */
export interface RouteRecordRaw {
    id: number
    path: string
    name: string
    component?: string
    redirect?: string
    meta: {
        title: string
        icon: string
        isExt: boolean
        extOpenMode: number
        type: number
        orderNo: number
        show: number
        activeMenu: string
        status: number
        keepAlive: number
    }
    children?: RouteRecordRaw[]
}


function createRoute(menu: MenuEntity, _isRoot: boolean): RouteRecordRaw {
    const commonMeta: RouteRecordRaw['meta'] = {
        title: menu.name,
        icon: menu.icon,
        isExt: menu.isExt,
        extOpenMode: menu.extOpenMode,
        type: menu.type,
        orderNo: menu.orderNo,
        show: menu.show,
        activeMenu: menu.activeMenu,
        status: menu.status,
        keepAlive: menu.keepAlive
    }

    return {
        id: menu.id,
        component: isExternal(menu.path) ? undefined : menu.component,
        path: menu.path,
        name: menu.name,
        meta: { ...commonMeta }
    }
}

function filterAsyncRoutes(menus: MenuEntity[], parentRoute: MenuEntity): RouteRecordRaw[] {
    const Routes: RouteRecordRaw[] = []

    const getFullPath = (path: string, parentPath: string) => {
        return uniqueSlash(path.startsWith('/') ? path : `${parentPath}/${path}`)
    }

    menus.forEach((menu: MenuEntity) => {
        // 过滤掉按钮权限 及 状态为禁用的菜单
        if (menu.type === 2 || !menu.status) {
            return 
        }

        let realRoute: RouteRecordRaw

        // 根菜单
        if (!parentRoute && !menu.parentId && menu.type === 1) {
            realRoute = createRoute(menu, true)
        } 
        // 根目录
        else if (!parentRoute && menu.parentId && menu.type === 0) {
            realRoute = createRoute(menu, true)
            const childRoutes = filterAsyncRoutes(menus, menu)
            if (childRoutes && childRoutes.length > 0) {
                realRoute.redirect = getFullPath(childRoutes[0].path, realRoute.path)
                realRoute.children = childRoutes
            }
        }
        // 子菜单
        else if (parentRoute && menu.parentId === parentRoute.id && menu.type === 1) {
            realRoute = createRoute(menu, false)
        }
        // 子目录
        else if (parentRoute && menu.parentId === parentRoute.id && menu.type === 0) {
            realRoute = createRoute(menu, false)
            const childRoutes = filterAsyncRoutes(menus, menu)
            if (childRoutes && childRoutes.length > 0) {
                realRoute.redirect = getFullPath(childRoutes[0].path, realRoute.path)
                realRoute.children = childRoutes
            }
        }

        if (realRoute) {
            Routes.push(realRoute)
        }
    })

    return Routes
}

export function generatorRouters(menus: MenuEntity[]): RouteRecordRaw[] {
    return filterAsyncRoutes(menus, null)
}

/**
 * type:0 目录 1、菜单 2、按钮权限
 * 1、过滤掉按钮权限 及 状态为禁用的菜单
 * 2、判断是否是根菜单-【!parentRoute && !菜单parentId && type为1】
 *      2.1、创建根菜单
 * 3、判断是否是根目录-【!parentRoute && !菜单parentId && type为0】
 *      3.1、创建根目录
 *      3.2、递归获取所有该目录下的子菜单
 *      3.3、如果子菜单存在，则将第一个子菜单的path与根目录的path拼接，作为根目录的redirect
 *      3.4、将子菜单挂载到根目录的children中
 * 4、判断是否是子菜单-【parentRoute && 菜单parentId === parentRoute.id && type为1】
 *      4.1、创建子菜单 ---- 当前菜单是指定父路由的直接子菜单
 * 5、判断是否是子目录-【parentRoute && 菜单parentId === parentRoute.id && type为0】
 *      5.1、创建子目录 ---- 子级目录，需要继续递归处理
 *      5.2、递归获取该子目录下的所有子菜单
 *      5.3、如果子菜单存在，则将第一个子菜单的path与子目录的path拼接，作为子目录的redirect
 *      5.4、将子菜单挂载到子目录的children中
 * 6、将创建的路由push到result中
 * 7、返回result
 */