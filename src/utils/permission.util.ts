import { MenuEntity } from '~/modules/system/menu/menu.entity'
import { isExternal } from './is.util'
import { uniqueSlash } from './tool.util'

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
    keepAlive: menu.keepAlive,
  }

  return {
    id: menu.id,
    component: isExternal(menu.path) ? undefined : menu.component,
    path: menu.path,
    name: menu.name,
    meta: { ...commonMeta },
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
    else if (!parentRoute && !menu.parentId && menu.type === 0) {
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

export interface MenuTreeNode extends Omit<MenuEntity, 'hasId' | 'save' | 'remove' | 'softRemove' | 'recover' | 'reload'> {
  children?: MenuTreeNode[]
  pid?: number
}

/**
 * 根目录 type=0 & parentMenu=null & menu.parentId=null
 * 根菜单 type=1 & parentMenu=null & menu.parentId=null
 * 子目录 - 该目录下可能还存在子菜单和权限
 * 子菜单
 * 权限
 */
function filterMenuToTable(menus: MenuEntity[], parentMenu?: MenuEntity): MenuTreeNode[] {
  // 按父ID分组，提升查找效率
  const menuMap = new Map<number | null, MenuEntity[]>()
  menus.forEach((menu) => {
    const parentId = menu.parentId ?? null
    if (!menuMap.has(parentId)) {
      menuMap.set(parentId, [])
    }
    menuMap.get(parentId)!.push(menu)
  })

  // 递归构建树
  function buildTree(parentId: number | null): MenuTreeNode[] {
    const children = menuMap.get(parentId) || []
    return children
      .filter((menu) => {
        // 根级别只要目录和菜单
        if (parentId === null) {
          return menu.type === 0 || menu.type === 1
        }
        // 子级别要所有类型
        return true
      })
      .map((menu) => {
        const node: MenuTreeNode = { ...menu, pid: menu.id }

        // 如果是目录或菜单，继续查找子项
        if (menu.type === 0 || menu.type === 1) {
          const childNodes = buildTree(menu.id)
          if (childNodes.length > 0) {
            node.children = childNodes
          }
        }

        return node
      })
  }

  return buildTree(parentMenu?.id ?? null)
}

export function generatorMenu(menus: MenuEntity[]) {
  return filterMenuToTable(menus, null)
}
