import { RedisKeys } from '~/constants/cache.constant'

/** 生成 token blacklist redis key */
export function genTokenBlacklistKey(tokenId: string) {
  return `${RedisKeys.TOKEN_BLACKLIST_PREFIX}${String(tokenId)}` as const
}
