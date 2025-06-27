import type { FastifyRequest } from 'fastify'
import type { IncomingMessage } from 'node:http'
import axios from 'axios'

/**
 * 为什么要收集用户Ip
 * 1、防止用户恶意登录、如异常登录(前后登录地不一致)、则需要让用户做额外验证
 * 2、地域限制、对于一些海外地进行进一步的验证
 * 3、统计分析、如用户登录地分布、登录时间分布等
 * 4、安全防范、如防止DDoS攻击、IP封禁等
 * 5、速率限制等等
 */

/**
 * 获取IP
 * @param request 请求对象
 * @returns IP
 */
export function getIp(request: FastifyRequest | IncomingMessage) {
    const req = request as any
  
    let ip: string
      = request.headers['x-forwarded-for']
      || request.headers['X-Forwarded-For']
      || request.headers['X-Real-IP']
      || request.headers['x-real-ip']
      || req?.ip
      || req?.raw?.connection?.remoteAddress
      || req?.raw?.socket?.remoteAddress
      || undefined
    if (ip && ip.split(',').length > 0)
      ip = ip.split(',')[0]
  
    return ip
  }

/* 判断IP是不是内网 */
function isLAN(ip: string) {
  ip.toLowerCase()
  if (ip === 'localhost')
    return true
  let a_ip = 0
  if (ip === '')
    return false
  const aNum = ip.split('.')
  if (aNum.length !== 4)
    return false
  a_ip += Number.parseInt(aNum[0]) << 24
  a_ip += Number.parseInt(aNum[1]) << 16
  a_ip += Number.parseInt(aNum[2]) << 8
  a_ip += Number.parseInt(aNum[3]) << 0
  a_ip = (a_ip >> 16) & 0xFFFF
  return (
    a_ip >> 8 === 0x7F
    || a_ip >> 8 === 0xA
    || a_ip === 0xC0A8
    || (a_ip >= 0xAC10 && a_ip <= 0xAC1F)
  )
}
  
export async function getIpAddress(ip: string) {
  if (isLAN(ip))
    return '内网IP'
  try {
    let { data } = await axios.get(
      `https://whois.pconline.com.cn/ipJson.jsp?ip=${ip}&json=true`,
      { responseType: 'arraybuffer' },
    )
    data = new TextDecoder('gbk').decode(data)
    data = JSON.parse(data)
    return data.addr.trim().split(' ').at(0)
  }
  catch (error) {
    return '第三方接口请求失败'
  }
}
