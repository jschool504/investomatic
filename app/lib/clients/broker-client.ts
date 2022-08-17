import fetch from 'node-fetch'
import Settings from '../../settings'
import { History } from '../models/external'
import { measure } from '../utils'
const createBrokerQuote = require('../models/broker-quote')


interface BrokerClientContext {
    fetch: typeof fetch
}


export default class BrokerClient {
    private _fetch: typeof fetch

    constructor(ctx: BrokerClientContext) {
        this._fetch = ctx.fetch
    }

    @measure
    async getPriceHistories(symbols): Promise<History[]> {
        const requests = symbols.map(async (s) => {
            const r = await this._fetch(`${Settings.BrokerApiBaseUrl}/marketdata/${s}/pricehistory?periodType=month&period=3&frequencyType=daily&apikey=${Settings.BrokerApiKey}`)
            return await r.json()
        })

        const results: History[] = await Promise.all(requests)

        return results
    }

    @measure
    async getQuotes(symbols) {
        const result = await this._fetch(`${Settings.BrokerApiBaseUrl}/marketdata/quotes?apikey=${Settings.BrokerApiKey}&symbol=${symbols.join(',')}`)
        const quoteResponse = await result.json()
    
        const output = symbols.reduce(
            (collected, quote) => ([
                ...collected,
                createBrokerQuote({
                    ...quoteResponse[quote],

                    // we need to remap these because JS doesn't like object keys starting with numbers
                    fiftyTwoWkHigh: quoteResponse[quote]['52WkHigh'],
                    fiftyTwoWkLow: quoteResponse[quote]['52WkLow'],
                })
            ]),
            []
        )
    
        return output
    }

}
