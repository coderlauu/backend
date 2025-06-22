import { INestApplication, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ConfigKeyPaths } from "./config";
import { TAppConfig } from "./config/app.config";
import { TSwaggerConfig } from "./config/swagger.config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { API_SECURITY_AUTH } from "./common/decorators/swagger.decorator";


export function setupSwagger(app: INestApplication, configService: ConfigService<ConfigKeyPaths>) {
    const { name, globalPrefix } = configService.get<TAppConfig>('app')
    const { enable, path, serverUrl } = configService.get<TSwaggerConfig>('swagger')
    
    if (!enable) return

    const swaggerPath = `${serverUrl}/${path}`

    const documentBuilder = new DocumentBuilder()
    .setTitle(name)
    .setDescription(`
🔷 **Base URL**: \`${serverUrl}/${globalPrefix}\` <br>
🧾 **Swagger JSON**: [查看文档 JSON](${swaggerPath}/json)

📌 [nest-react-admin](【线上服务地址】) 后台管理系统 API 文档. 在线 demo [nest-react-admin](【线上服务地址】)
    `)
    .setVersion('1.0')
    .addServer(`${serverUrl}/${globalPrefix}`, 'Base URL')
    .addSecurity(API_SECURITY_AUTH, {
        description: '输入令牌（Enter the token）',
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
    })

    const document = SwaggerModule.createDocument(app, documentBuilder.build(), {
        ignoreGlobalPrefix: true,
        /** TODO: 包含额外的模型类型定义 */
        extraModels: []
    })

    SwaggerModule.setup(path, app, document, {
        swaggerOptions: {
            persistAuthorization: true, // 保持登录
        },
        jsonDocumentUrl: `/${path}/json`
    })

    return () => {
        const logger = new Logger('SwaggerModule')
        logger.log(`Swagger UI: ${swaggerPath}`)
        logger.log(`Swagger JSON: ${swaggerPath}/json`)
    }
}