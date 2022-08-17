import { Knex } from 'knex'
import * as domain from '../models/domain'
import { Symbol } from '../models/persistence'
import { measure } from '../utils'


const toDomain = (persisted: Symbol): domain.Symbol => ({
    ticker: persisted.ticker,
    watch: persisted.watch
})


const toPersisted = (domain: domain.Symbol): Symbol => ({
    ticker: domain.ticker,
    watch: domain.watch
})


interface SymbolRepositoryContext {
    knex: Knex
}


class SymbolRepository {

    constructor(
        private ctx: SymbolRepositoryContext
    ) {}

    @measure
    async getWatched(): Promise<Symbol[]> {
        const persisted = await this.ctx.knex<Symbol>('symbols')
            .select('*')
            .where('watch', true)
            
        return persisted.map(toDomain)
    }

    @measure
    async insert(symbol: domain.Symbol) {
        const persisted = toPersisted(symbol)

        const existing = await this.ctx.knex<Symbol>('symbols')
            .select('*')
            .where('ticker', persisted.ticker)

        if (existing.length > 0) {
            return await this.update(symbol)
        }

        return await this.ctx.knex<Symbol>('symbols')
            .insert(persisted)
    }

    @measure
    async update(symbol: domain.Symbol) {
        const persisted = toPersisted(symbol)
        return await this.ctx.knex<Symbol>('symbols')
            .update(persisted)
            .where('ticker', persisted.ticker)
    }

}

export default SymbolRepository
