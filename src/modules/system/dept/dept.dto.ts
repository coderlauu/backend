import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";



export class DeptDto {
    @ApiProperty({ description: '部门名称' })
    @IsString()
    @IsNotEmpty()
    name: string
    
    @ApiProperty({ description: '父级id' })
    @IsNumber()
    @IsOptional()
    parentId?: number

    @ApiProperty({ description: '排序' })
    @IsNumber()
    @IsOptional()
    orderNo?: number   
}

export class DeptQueryDto {
    @ApiProperty({ description: '部门名称' })
    @IsString()
    @IsOptional()
    name?: string
}