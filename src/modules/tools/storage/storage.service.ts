import { Injectable } from "@nestjs/common";
import { StoragePageDto } from "./storage.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Like, Repository } from "typeorm";
import { Pagination } from "~/helper/paginate/pagination";
import { UserEntity } from "~/modules/user/user.entity";
import { paginateRaw } from "~/helper/paginate";
import { PaginationTypeEnum } from "~/helper/paginate/interface";
import { StorageInfo } from "./storage.modal";
import { Storage } from "./storage.entity";
import { deleteFile } from "~/utils/file.util";



@Injectable()
export class StorageService {
    constructor(
        @InjectRepository(Storage)
        private storageRepository: Repository<Storage>,
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
    ) {}

    async list({
        page,
        pageSize,
        name,
        type,
        size,
        extName,
        time,
        username
    }: StoragePageDto): Promise<Pagination<StorageInfo>> {
        const queryBuilder = this.storageRepository
            .createQueryBuilder('storage')
            .leftJoinAndSelect('sys_user', 'user', 'storage.user_id = user.id')
            .where({
                ...(name && { name: Like(`%${name}%`) }),
                ...(type && { type }),
                ...(extName && { extName }),
                ...(size && { size: Between(size[0], size[1]) }),
                ...(time && { createdAt: Between(time[0], time[1]) }),
                ...(username && {
                userId: await (await this.userRepository.findOneBy({ username }))?.id,
                }),
            })
            .orderBy('storage.created_at', 'DESC')

        const { items, ...rest } = await paginateRaw<Storage>(queryBuilder, {
            page,
            pageSize,
            paginationType: PaginationTypeEnum.LIMIT_AND_OFFSET
        })

        function formatResult(result: Storage[]) {
            return result.map((e: any) => {
              return {
                id: e.storage_id,
                name: e.storage_name,
                extName: e.storage_ext_name,
                path: e.storage_path,
                type: e.storage_type,
                size: e.storage_size,
                createdAt: e.storage_created_at,
                username: e.user_username,
              }
            })
          }

          return {
            items: formatResult(items),
            ...rest
          }
    }

    async delete(fileIds: number[]): Promise<void> {
        const items = await this.storageRepository.findByIds(fileIds)
        await this.storageRepository.delete(fileIds)

        items.forEach(el => {
            deleteFile(el.path)
        })
    }
}