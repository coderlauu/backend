import { Module } from "@nestjs/common";
import { DeptController } from "./dept.controller";
import { DeptService } from "./dept.service";
import { DeptEntity } from "./dept.entity";
import { TypeOrmModule } from "@nestjs/typeorm";




@Module({
    imports: [TypeOrmModule.forFeature([DeptEntity])],
    controllers: [DeptController],
    providers: [DeptService],
})
export class DeptModule {}