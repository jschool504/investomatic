import fs from 'fs'


interface Credentials {
    awsCredentials: {
        accessKeyId: string
        secretAccessKey: string
    }
    FunctionName: string
    BrokerApiBaseUrl: string
    BrokerApiKey: string
    ClickSendUsername: string
    ClickSendPassword: string
    AWSAccessKeyId: string
    AWSSecretKey: string
    DatabaseCredentials: {
        user: string
        database: string
        host: string
        port: number
        password: string
        ssl: {
            cert: Buffer
        }
    }
    Phone: string
    TelegramToken: string
}


interface ConfigOptions {
    SuppressSms: boolean
    port: number
    TelegramChatId: number
    DefaultSymbols: string[] | undefined // default stock tickers to use - should only be defined in development
    QuoteRetentionPeriod: number | undefined
}


type Settings = Credentials & ConfigOptions

export default Settings

const SettingsFileNames = {
    prod: './credentials.json',
    undefined: './dev-credentials.json'
}

export class SettingsManager {

    private settings: Settings

    constructor(ctx: { env: string }) {

        const fileCredentials = JSON.parse(
            fs.readFileSync(SettingsFileNames[ctx.env])
                .toString()
        ) as Credentials

        const fileSettings = JSON.parse(fs.readFileSync('./settings.json').toString()) as Settings
        const options: ConfigOptions = {
            ...fileSettings,
            SuppressSms: ctx.env !== 'prod',
            port: ctx.env !== 'prod' ? 8000 : 80
        }

        const credentials: Credentials = {
            ...fileCredentials,
            DatabaseCredentials: {
                ...fileCredentials.DatabaseCredentials,
                ssl: ctx.env !== 'prod' ? null : {
                    cert: fs.readFileSync('./ca-certificate.crt')
                }
            }
        }
        
        
        const settings: ConfigOptions & Credentials = {
            ...options,
            ...credentials
        }
        
        if (ctx.env !== 'prod') {
            console.log(settings)
        }

        this.settings = settings
    }

    get(): Settings {
        return this.settings
    }
}

