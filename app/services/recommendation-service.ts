import ConfigurationClient from '../lib/clients/configuration-client'
import BrokerClient from '../lib/clients/broker-client'
import QuoteRepository from '../lib/repositories/quote-repository'
import RecommendationEngine from '../lib/engines/recommendation-engine'
import CandleRepository from '../lib/repositories/candle-repository'
import dayjs from 'dayjs'
import RecommendationRepository from '../lib/repositories/recommendation-repository'
import SMSClient from '../lib/clients/sms-client'
import { Recommendation } from '../lib/models/domain'
import SymbolRepository from '../lib/repositories/symbol-repository'


interface RecommendationServiceContext {
    symbolRepository: SymbolRepository
    brokerClient: BrokerClient
    quoteRepository: QuoteRepository
    recommendationEngine: RecommendationEngine
    candleRepository: CandleRepository
    recommendationRepository: RecommendationRepository
    smsClient: SMSClient
}


const RecommendationService = (ctx: RecommendationServiceContext) => ({

    buildRecommendations: async () => {
        const symbols = (await ctx.symbolRepository.getWatched()).map(({ ticker }) => ticker)
        const quotes = await ctx.quoteRepository.getQuotesBySymbols(symbols)
        const candles = await ctx.candleRepository.getCandlesBySymbols(symbols)
        const intervalPercentage = dayjs().date() / dayjs().daysInMonth()
        const recommendations: Recommendation[] = ctx.recommendationEngine.getRecommendations(quotes, candles, intervalPercentage, dayjs())
        return await ctx.recommendationRepository.insert(recommendations)
    },

    processRecommendations: async () => {

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
            return `${rec.symbol} is $${rec.askPrice}\n* that's ${Math.abs(threeMo).toFixed(2)}% ${threeMoComparePhrase} it's 3 month high of $${rec.range.high}\n* and ${Math.abs(year).toFixed(2)}% ${yearComparePhrase} it's 52 week high of $${rec.fiftyTwoWkHigh}`
        }

        const recommendations = await ctx.recommendationRepository.getUnprocessedRecommendations()
        const recsBySymbol = recommendations
            .filter(rec => !!rec.buy)
            .reduce(bySymbol, {})

        const symbols = Object.keys(recsBySymbol)

        const symbolMessages = Object.values(recsBySymbol)
            .map(msgFromRec)


        if (symbols.length > 0) {
            const message = `👋 you might want to buy ${symbols.join(', ')}\n\n` + symbolMessages.join('\n\n')
            await ctx.smsClient.send(message)
        }

        await ctx.recommendationRepository.markRecommendationsAsProcessed()
    }

})


export default RecommendationService
