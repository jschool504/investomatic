import ConfigurationClient from '../lib/clients/configuration-client'
import BrokerClient from '../lib/clients/broker-client'
import QuoteRepository from '../lib/repositories/quote-repository'
import SymbolRepository from '../lib/repositories/symbol-repository'


interface QuoteServiceContext {
    symbolRepository: SymbolRepository
    brokerClient: BrokerClient
    quoteRepository: QuoteRepository
}


class QuoteService {

    constructor(
        private ctx: QuoteServiceContext
    ) {}

    async fetchQuotes(tickers: string[] | null) {
        const symbols = tickers || (await this.ctx.symbolRepository.getWatched()).map(({ ticker }) => ticker)
        const quotes = await this.ctx.brokerClient.getQuotes(symbols)
        return await this.ctx.quoteRepository.insert(quotes)
    }

}


export default QuoteService
