import { ApiProperty } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";
import { Allow, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export enum Order {
    ASC = 'ASC',
    DESC = 'DESC',
  }

export class PagerDto<T = any> {
    @ApiProperty({ minimum: 1, default: 1 })
    @Min(1)
    @IsInt()
    @Expose()
    @IsOptional({ always: true })
    /** 请求参数通常是字符串, {page: "1"} -> page: 1 */
    @Transform(({ value: val }) => (val ? Number.parseInt(val) : 1), {
        toClassOnly: true
    })
    page?: number

    @ApiProperty({ minimum: 1, maximum: 100, default: 10 })
    @Min(1)
    @Max(100)
    @IsInt()
    @IsOptional({ always: true })
    @Expose()
    @Transform(({ value: val }) => (val ? Number.parseInt(val) : 10), {
        toClassOnly: true
    })
    pageSize?: number

    @ApiProperty()
    @IsString()
    @IsOptional()
    field?: string // | keyof T

    @ApiProperty({ enum: Order })
    @IsEnum(Order)
    @IsOptional()
    @Transform(({ value: val }) => (val === 'asc' ? Order.ASC : Order.DESC))
    order?: Order

    /**
     * 允许该属性通过验证，不进行任何验证规则检查
     * fetch('/api/data?page=1&pageSize=10&_t=' + Date.now())
     * _t 通常是时间戳，以免前端浏览器或代理服务器对请求进行缓存
     */
    @Allow()
    _t?: number
}