import { forwardRef, Module } from "@nestjs/common";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Storage } from "../storage/storage.entity";
import { StorageModule } from "../storage/storage.module";


@Module({
    // 当两个或多个模块相互引用时，使用forwardRef延迟获取模块引用，避免循环依赖
    imports: [forwardRef(() => StorageModule)],
    exports: [UploadService],
    controllers: [UploadController],
    providers: [UploadService]
})
export class UploadModule {}