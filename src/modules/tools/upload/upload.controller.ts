import { BadRequestException, Controller, Post, Req } from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiSecurityAuth } from "~/common/decorators/swagger.decorator";
import { definePermission, Perm } from "~/modules/auth/decorators/permission.decorator";
import { UploadService } from "./upload.service";
import { FileUploadDto } from "./upload.dto";
import { FastifyRequest } from 'fastify'
import { AuthUser } from "~/modules/auth/decorators/auth-user.decorator";

export const permissions = definePermission('upload', {
    UPLOAD: 'upload',
  } as const)
  
  @ApiSecurityAuth()
  @ApiTags('Tools - 上传模块')
  @Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}
    
    @Post()
    @Perm(permissions.UPLOAD)
    @ApiOperation({ summary: '上传文件' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        type: FileUploadDto
    })
    async uploadFile(@Req() req: FastifyRequest, @AuthUser() user: IAuthUser) {
        if (!req.isMultipart())
            throw new BadRequestException('Request is not multipart')

        const file = await req.file()

        // https://github.com/fastify/fastify-multipart   --- 多文件
        // const parts = req.files()
        // for await (const part of parts)
        //   console.log(part.file)

        try {
            const path = await this.uploadService.saveFile(file, user.uid)

            return { filename: path }
        } catch (error) {
            throw new BadRequestException('上传失败')
        }
    }
}