import { Knex } from 'knex'
import * as domain from '../models/domain'
import { Candle } from '../models/persistence'

interface CandleRepositoryContext {
    candleDbClient: Knex.QueryBuilder<Candle>
    candlesDbClient: Knex.QueryBuilder<Candle[]>
}


const toPersisted = (domain: domain.Candle): Candle => ({
    symbol: domain.symbol,
    open: domain.open,
    high: domain.high,
    low: domain.low,
    close: domain.close,
    volume: domain.volume,
    datetime: domain.datetime
})

const toDomain = (persisted: Candle): domain.Candle => ({
    symbol: persisted.symbol,
    open: persisted.open,
    high: persisted.high,
    low: persisted.low,
    close: persisted.close,
    volume: persisted.volume,
    datetime: persisted.datetime
})


class CandleRepository {
    private ctx: CandleRepositoryContext

    constructor(ctx: CandleRepositoryContext) {
        this.ctx = ctx
    }

    async getCandlesBySymbols(symbols: string[]): Promise<domain.Candle[]> {
        const persisted = await this.ctx.candlesDbClient
            .select('*')
            .distinct()
            .orderBy('datetime', 'desc')

        const candles = persisted.map(toDomain)

        return candles
    }

    async insert(candles: domain.Candle[]) {
        return await this.ctx.candleDbClient.insert(
            candles.map(toPersisted)
        )
    }

}

export default CandleRepository
