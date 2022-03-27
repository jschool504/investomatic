import Configuration from '../models/configuration'
import S3Client from './s3-client'

interface ConfigurationClientContext {
    s3Client: S3Client
}

export default class ConfigurationClient {
    private _s3Client: S3Client

    constructor(ctx: ConfigurationClientContext) {
        this._s3Client = ctx.s3Client
    }

    async get(): Promise<Configuration> {
        const configString: string = await this._s3Client.get('investomatic-db', 'configuration.json')
        return JSON.parse(configString)
    }

}
