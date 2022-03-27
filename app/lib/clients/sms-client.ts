import fetch from 'node-fetch'
import Settings from '../../settings'

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


class SMSClient {
    private _authHeader: string
    private _baseUrl: string
    private _fetch: typeof fetch

    constructor(ctx: SmsClientContext) {
        this._baseUrl = 'https://rest.clicksend.com/v3'
        this._authHeader = generateBasicAuthHeader(ctx.clickSendCredentials)
        this._fetch = ctx.fetch
    }

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
            const response = await this._fetch(this._baseUrl + '/sms/send', {
                method: 'POST',
                headers: {
                    'Authorization': this._authHeader,
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
