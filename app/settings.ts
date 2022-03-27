import fs from 'fs'
import fileCredentials from './credentials.json'


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
}


interface ConfigOptions {
    SuppressSms: boolean
}


const options: ConfigOptions = {
    SuppressSms: process.env.ENV !== 'prd'
}


const credentials: Credentials = {
    ...fileCredentials,
    DatabaseCredentials: {
        ...fileCredentials.DatabaseCredentials,
        ssl: {
            cert: fs.readFileSync('./ca-certificate.crt')
        }
    }
}


const settings: ConfigOptions & Credentials = {
    ...options,
    ...credentials
}

if (process.env.ENV !== 'prd') {
    console.log(settings)
}

export default settings
