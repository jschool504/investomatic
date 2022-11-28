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

    constructor(ctx: {}) {

        const fileCredentials = JSON.parse(
            fs.readFileSync(SettingsFileNames[process.env.ENV])
                .toString()
        ) as Credentials

        const fileSettings = JSON.parse(fs.readFileSync('./settings.json').toString()) as Settings
        const options: ConfigOptions = {
            ...fileSettings,
            SuppressSms: process.env.ENV !== 'prod',
            port: process.env.ENV !== 'prod' ? 8000 : 80
        }

        const credentials: Credentials = {
            ...fileCredentials,
            DatabaseCredentials: {
                ...fileCredentials.DatabaseCredentials,
                ssl: process.env.ENV !== 'prod' ? null : {
                    cert: fs.readFileSync('./ca-certificate.crt')
                }
            }
        }
        
        
        const settings: ConfigOptions & Credentials = {
            ...options,
            ...credentials
        }
        
        if (process.env.ENV !== 'prod') {
            console.log(settings)
        }

        this.settings = settings
    }

    get(): Settings {
        return this.settings
    }
}

