import { Module } from "@nestjs/common";
import { StorageModule } from "./storage/storage.module";
import { UploadModule } from "./upload/upload.module";
import { RouterModule } from "@nestjs/core";
import { EmailModule } from "./email/email.module";

const modules = [StorageModule, UploadModule, EmailModule]

@Module({
    imports: [
        ...modules,
        RouterModule.register([
            {
                path: 'tools',
                module: ToolsModule,
                children: [...modules]
            }
        ])
    ],
    exports: [...modules]
})
export class ToolsModule {}