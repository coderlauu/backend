import { MultipartFile } from '@fastify/multipart'
import dayjs from 'dayjs'
import fs from 'node:fs'
import path from 'node:path'

enum Type {
    IMAGE = 'Images',
    TXT = 'Documents',
    MUSIC = 'Music',
    VIDEO = 'Videos',
    OTHER = 'Others',
  }


  export function getFileType(extName: string) {
    const documents = 'txt doc pdf ppt pps xlsx xls docx'
    const music = 'mp3 wav wma mpa ram ra aac aif m4a'
    const video = 'avi mpg mpe mpeg asf wmv mov qt rm mp4 flv m4v webm ogv ogg'
    const image = 'bmp dib pcp dif wmf gif jpg tif eps psd cdr iff tga pcd mpt png jpeg'

    if (documents.includes(extName)) return Type.TXT
    if (music.includes(extName)) return Type.MUSIC
    if (video.includes(extName)) return Type.VIDEO
    if (image.includes(extName)) return Type.IMAGE

    return Type.OTHER
  }

  export function getName(fileName: string) {
    if (fileName.includes('.')) {
        return fileName.split('.')[0]
    }

    return fileName
  }

  export function getExtName(fileName: string) {
    return path.extname(fileName).replace('.', '')
  }

  export function getSize(bytes: number, decimal = 2) {
    if (bytes === 0) {
      return '0 Bytes'
    }

    const k = 1024
    const dm = decimal < 0 ? 0 :decimal
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
  }

  export function fileRename(fileName: string) {
    const name = fileName.split('.')[0]
    const extName = path.extname(fileName)
    const time = dayjs().format('YYYYMMDDHHmmSSS')
    return `${name}-${time}${extName}`
  }

  export function getFilePath(name: string, currentDate: string, type: string) {
    return `/upload/${currentDate}/${type}/${name}`
  }

  export async function saveLocalFile(buffer: Buffer, name: string, currentDate: string, type: string) {
    const filePath = path.join(__dirname, '../../', 'public/upload/', `${currentDate}/`, `${type}/`)

    try {
      // 判断是否有该文件夹
      await fs.promises.stat(filePath)
    } catch (error) {
      // 没有则创建
      await fs.promises.mkdir(filePath, { recursive: true })
    }
    const writeStream = fs.createWriteStream(filePath + name)
    writeStream.write(buffer)
  }

  export async function saveFile(file: MultipartFile, name: string) {
    const filePath = path.join(__dirname, '../../', 'public/upload', name)
    const writeStream = fs.createWriteStream(filePath)
    const buffer = await file.toBuffer()
    writeStream.write(buffer)
  }

  /**
   * 删除本地文件
   * @param name 文件路径
   */
  export async function deleteFile(name: string) {
    try {
      const filePath = path.join(__dirname, '../../', 'public', name)
      
      // 检查文件是否存在
      await fs.promises.access(filePath)
      
      // Node.js 删除文件的方法
      await fs.promises.unlink(filePath)
      
      console.log(`文件删除成功: ${filePath}`)
      return true
    } catch (error) {
      console.error(`文件删除失败: ${name}`, error.message)
      return false
    }
  }