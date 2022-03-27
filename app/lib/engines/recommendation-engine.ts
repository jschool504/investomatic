// somewhat arbitrary threshold indicating when we should make a purchase
// more or less, this threshold says we want our price to be no more than

import { Dayjs } from "dayjs"
import { Recommendation } from "../models/domain"

// x% higher than the previous lowest value
const BUY_THRESHOLD = 0.15


interface RecommendationEngineContext {}


export default class RecommendationEngine {

    constructor(ctx: RecommendationEngineContext) {}

    // calculate current price percentage relative to past highs and lows
    // scale up 3 month weighting vs 52 wk as we get closer to the intervals' end
    // basically, we use a longer back history at the beginning to try and get a
    // better deal, but as time goes on, we increase the weight of recent data to
    // "take what we can get" - we still may not buy anything if the price relative
    // to the last 3 months is high
    getRecommendation(quote, candles, intervalPercentage) {

        const getPriceRange = candles => candles.reduce(
            (collected, candle) => {
                const isNewRecordHigh = candle.close > collected.high
                const isNewRecordLow = candle.close < collected.low
                return {
                    high: isNewRecordHigh ? candle.close : collected.high,
                    low: isNewRecordLow ? candle.close : collected.low,
                }
            },
            {
                high: candles[0].close,
                low: candles[0].close
            }
        )

        const range = getPriceRange(candles)

        // price position relative to range in last 3 months
        const threeMonthPercent = (quote.askPrice - range.low) / (range.high - range.low)

        // price position relative to range in last year
        const yearPercent = (quote.askPrice - quote.fiftyTwoWkLow) / (quote.fiftyTwoWkHigh - quote.fiftyTwoWkLow)

        // price percentage interpolation from year to 3mos over
        // our "interval" - the progress through the current month
        const interpolatedPricePercentage = ((1.0 - intervalPercentage) * yearPercent) + (intervalPercentage * threeMonthPercent)

        // additional weighting to buy towards the end of the month
        const intervalProgressWeight = intervalPercentage * 0.2

        // number representing our overall recommendation
        // lower is better
        const combinedAndWeightedPricePercentage = interpolatedPricePercentage - intervalProgressWeight

        // boolean recomendation
        const buy = combinedAndWeightedPricePercentage < BUY_THRESHOLD

        return {
            symbol: quote.symbol,
            askPrice: quote.askPrice,
            threeMonthPercent,
            yearPercent,
            interpolatedPricePercentage,
            intervalProgressWeight,
            combinedAndWeightedPricePercentage,
            range,
            buy,
            fiftyTwoWkHigh: quote.fiftyTwoWkHigh,
            processed: false
        }

    }

    getRecommendations(quotes: any, candles: any, intervalPercentage: any, today: Dayjs): Recommendation[] {
        const adviceForQuotes = quotes.map(quote => {
            
            const symbolCandles = candles.filter(candle => quote.symbol === candle.symbol)
            const recommendation = this.getRecommendation(quote, symbolCandles, intervalPercentage)

            return {
                ...recommendation,
                symbol: quote.symbol,
                intervalPercentage,
                createdAt: today.toISOString()
            }

        })

        return adviceForQuotes
    }

}

module.exports = RecommendationEngine
