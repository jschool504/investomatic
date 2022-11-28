import ConfigurationClient from '../lib/clients/configuration-client'
import BrokerClient from '../lib/clients/broker-client'
import QuoteRepository from '../lib/repositories/quote-repository'
import SymbolRepository from '../lib/repositories/symbol-repository'
import { measure } from '../lib/utils'
import dayjs, { Dayjs } from 'dayjs'
import Settings from '../settings'


interface QuoteServiceContext {
    symbolRepository: SymbolRepository
    brokerClient: BrokerClient
    quoteRepository: QuoteRepository
    settings: Settings
}


const SIX_MONTHS = 6 * 30 * 24 * 60 * 60 * 1000


class QuoteService {

    constructor(
        private ctx: QuoteServiceContext
    ) {}

    @measure
    async fetchQuotes(tickers: string[] | null) {
        const symbols = tickers || (
            (await this.ctx.symbolRepository.getWatched())
                .map(({ ticker }) => ticker)
        )
        const quotes = await this.ctx.brokerClient.getQuotes(symbols)
        return await this.ctx.quoteRepository.insert(quotes)
    }

    @measure
    async cleanUp() {
        const currentTimeMillis = dayjs().valueOf()
        const sixMonthsAgo = currentTimeMillis - SIX_MONTHS
        await this.ctx.quoteRepository.deleteBefore(this.ctx.settings.QuoteRetentionPeriod || sixMonthsAgo)
    }

}


export default QuoteService
