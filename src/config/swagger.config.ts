import { ConfigType, registerAs } from "@nestjs/config"
import { env, envOfBoolean } from "~/global/env"


export const swaggerKey = 'swagger'

export const SwaggerConfig = registerAs(swaggerKey, () => ({
    enable: envOfBoolean('SWAGGER_ENABLE'),
    path: env('SWAGGER_PATH'),
    serverUrl: env('SWAGGER_SERVER_URL', env('APP_BASE_URL'))
}))

export type TSwaggerConfig = ConfigType<typeof SwaggerConfig>