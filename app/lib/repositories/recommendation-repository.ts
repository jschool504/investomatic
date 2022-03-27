import dayjs from 'dayjs'
import { Knex } from 'knex'
import * as domain from '../models/domain'
import { Recommendation } from '../models/persistence'

interface RecommendationRepositoryContext {
    recommendationsDbClient: Knex.QueryBuilder<Recommendation[]>
    knex: Knex
}


const toPersisted = (domain: domain.Recommendation): Recommendation => ({
    symbol: domain.symbol,
    ask_price: domain.askPrice,
    three_month_percent: domain.threeMonthPercent,
    year_percent: domain.yearPercent,
    interpolated_price_percentage: domain.interpolatedPricePercentage,
    interval_progress_weight: domain.intervalProgressWeight,
    combined_and_weighted_price_percentage: domain.combinedAndWeightedPricePercentage,
    range_high: domain.range.high,
    range_low: domain.range.low,
    buy: domain.buy,
    processed: domain.processed,
    created_at: domain.createdAt,
    fifty_two_wk_high: domain.fiftyTwoWkHigh
})

const toDomain = (persisted: Recommendation): domain.Recommendation => ({
    symbol: persisted.symbol,
    askPrice: persisted.ask_price,
    threeMonthPercent: persisted.three_month_percent,
    yearPercent: persisted.year_percent,
    interpolatedPricePercentage: persisted.interpolated_price_percentage,
    intervalProgressWeight: persisted.interval_progress_weight,
    combinedAndWeightedPricePercentage: persisted.combined_and_weighted_price_percentage,
    range: {
        high: persisted.range_high,
        low: persisted.range_low
    },
    buy: persisted.buy,
    processed: persisted.processed,
    createdAt: persisted.created_at,
    fiftyTwoWkHigh: persisted.fifty_two_wk_high
})


class RecommendationRepository {
    private ctx: RecommendationRepositoryContext

    constructor(ctx: RecommendationRepositoryContext) {
        this.ctx = ctx
    }

    async getUnprocessedRecommendations(): Promise<domain.Recommendation[]> {
        const unprocessedRecommendations = await this.ctx.recommendationsDbClient
            .select('*')
            .where('processed', false)

        const recommendations = unprocessedRecommendations.map(toDomain)
        return recommendations
    }

    async markRecommendationsAsProcessed() {
        return await this.ctx.knex<{ processed: boolean }>('recommendations')
            .update({ processed: true })
            .where('processed', false)
    }

    async insert(recommendations: domain.Recommendation[]) {

        const existing = (await this.ctx.knex<Recommendation>('recommendations')
            .select('*')
            .whereIn('symbol', recommendations.map(r => r.symbol))
            .andWhere('buy', true)
            .andWhere('created_at', '>', dayjs().subtract(1, 'day').toISOString()))
            .map(({ symbol }) => symbol)

        const isNewRecommendation = (rec: Recommendation) => !existing.includes(rec.symbol)

        const newRecommendations = recommendations
            .map(toPersisted)
            .filter(isNewRecommendation)

        if (newRecommendations.length > 0) {
            return await this.ctx.recommendationsDbClient.insert(newRecommendations)
        }

        return await Promise.resolve()

    }

}

export default RecommendationRepository
