import BrokerClient from '../lib/clients/broker-client'
import QuoteRepository from '../lib/repositories/quote-repository'
import RecommendationEngine from '../lib/engines/recommendation-engine'
import CandleRepository from '../lib/repositories/candle-repository'
import dayjs from 'dayjs'
import RecommendationRepository from '../lib/repositories/recommendation-repository'
import { Recommendation } from '../lib/models/domain'
import SymbolRepository from '../lib/repositories/symbol-repository'
import { measure } from '../lib/utils'
import MessageClient from '../lib/interfaces/message-client'


interface RecommendationServiceContext {
    symbolRepository: SymbolRepository
    brokerClient: BrokerClient
    quoteRepository: QuoteRepository
    recommendationEngine: RecommendationEngine
    candleRepository: CandleRepository
    recommendationRepository: RecommendationRepository
    smsClient: MessageClient
}


class RecommendationService {

    constructor(
        private ctx: RecommendationServiceContext
    ) {}

    @measure
    async buildRecommendations(tickers: string[] | null = null, forceMessage: boolean = false) {
        let symbols: string[] = []
        if (tickers) {
            symbols = tickers
        } else {
            symbols = (await this.ctx.symbolRepository.getWatched()).map(({ ticker }) => ticker)
        }
        const quotes = await this.ctx.quoteRepository.getQuotesBySymbols(symbols)
        const candles = await this.ctx.candleRepository.getCandlesBySymbols(symbols)
        const intervalPercentage = dayjs().date() / dayjs().daysInMonth()
        const recommendations: Recommendation[] = this.ctx.recommendationEngine
            .getRecommendations(quotes, candles, intervalPercentage, dayjs())
            .map(rec => ({
                ...rec,
                sendMessage: forceMessage || rec.buy
            }))
        return await this.ctx.recommendationRepository.insert(recommendations)
    }

    @measure
    async processRecommendations() {

        const bySymbol = (recs: { [key: string]: Recommendation }, rec: Recommendation): { [key: string]: Recommendation } => {
            return {
                ...recs,
                [rec.symbol]: rec
            }
        }

        const msgFromRec = (rec: Recommendation) => {
            const threeMo = ((1 - (rec.askPrice / rec.range.high)) * 100)
            const year = ((1 - (rec.askPrice / rec.fiftyTwoWkHigh)) * 100)
            const isThreeMoHigher = threeMo < 0
            const isYearHigher = year < 0
            const threeMoComparePhrase = isThreeMoHigher ? 'higher than' : 'lower than'
            const yearComparePhrase = isYearHigher ? 'higher than' : 'lower than'
            const buyPhrase = rec.buy ? 'buy it!' : 'pass'

            return `${rec.symbol} is $${rec.askPrice}\n* that's ${Math.abs(threeMo).toFixed(2)}% ${threeMoComparePhrase} it's 3 month high of $${rec.range.high}\n* and ${Math.abs(year).toFixed(2)}% ${yearComparePhrase} it's 52 week high of $${rec.fiftyTwoWkHigh}\n* ${buyPhrase}`
        }

        const recommendations = await this.ctx.recommendationRepository.getUnprocessedRecommendations()
        const recsBySymbol = recommendations
            .filter(rec => !!rec.sendMessage)
            .reduce(bySymbol, {})

        const symbols = Object.keys(recsBySymbol)

        const symbolMessages = Object.values(recsBySymbol)
            .map(msgFromRec)

        if (symbols.length > 0) {
            const message = `👋 here are your recommendations for ${symbols.join(', ')}\n\n` + symbolMessages.join('\n\n')
            await this.ctx.smsClient.send(message)
        }

        await this.ctx.recommendationRepository.markRecommendationsAsProcessed()

    }

}


export default RecommendationService
