import fetch from 'node-fetch'
import Settings from '../../settings'
import { measure } from '../utils'

const generateBasicAuthHeader = (credentials) => {
    const { username, password } = credentials
    const buffer = Buffer.from(`${username}:${password}`)
    const encoded = buffer.toString('base64')
    return `Basic ${encoded}`
}


interface SmsClientContext {
    fetch: typeof fetch
    clickSendCredentials: { username: string, password: string }
}


const BASE_URL = 'https://rest.clicksend.com/v3'

class SMSClient {
    #authHeader: string

    constructor(
        private ctx: SmsClientContext
    ) {
        this.#authHeader = generateBasicAuthHeader(ctx.clickSendCredentials)
    }

    @measure
    async send(message: string) {
        const body = JSON.stringify({
            messages: [
                {
                    to: '+14104400948',
                    source: '+18338644190',
                    body: message
                }
            ]
        })

        if (!Settings.SuppressSms) {
            const response = await this.ctx.fetch(BASE_URL + '/sms/send', {
                method: 'POST',
                headers: {
                    'Authorization': this.#authHeader,
                    'Content-Type': 'application/json'
                },
                body
            })
    
            const responseBody = await response.json()
            // @ts-ignore
            if (responseBody.http_code > 299) {
                throw new Error(JSON.stringify(responseBody))
            }
        } else {
            console.log('SMS suppression on')
            console.log(body)
        }

    }

}

export default SMSClient
