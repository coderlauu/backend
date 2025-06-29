import { Global, Module } from "@nestjs/common";
import { QQService } from "./qq.service";

@Global()
@Module({
    imports: [],
    providers: [QQService],
    exports: [QQService]
})
export class HelperModule {}