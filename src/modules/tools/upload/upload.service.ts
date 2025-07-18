import { MultipartFile } from "@fastify/multipart";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import dayjs from "dayjs";
import { isNil } from "lodash";
import { Repository } from "typeorm";
import { fileRename, getExtName, getFilePath, getFileType, getSize, saveLocalFile } from "~/utils/file.util";
import { Storage } from "../storage/storage.entity";


@Injectable()
export class UploadService {
    constructor(
        @InjectRepository(Storage) private readonly storageRepository: Repository<Storage>
    ) {}

    async saveFile(file: MultipartFile, uid: number) {
        if (isNil(file)) 
            throw new NotFoundException('Have not any file to upload!')

        const fileName = file.filename
        const size = getSize(file.file.bytesRead)
        const extName = getExtName(fileName)
        const type = getFileType(extName)
        const name = fileRename(fileName)
        const currentDate = dayjs().format('YYYY-MM-DD')
        const path = getFilePath(name, currentDate, type)

        saveLocalFile(await file.toBuffer(), name, currentDate, type)

        // 写入数据库
        await this.storageRepository.save({
            name,
            fileName,
            extName,
            path,
            type,
            size,
            userId: uid
        })
        
        return path
    }
}