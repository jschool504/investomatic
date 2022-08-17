import dayjs from 'dayjs'
import { Knex } from 'knex'
import { Order } from '../models/domain'
import OrderType from '../models/domain/order-type'
import { Order as PersistedOrder } from '../models/persistence'
import { measure } from '../utils'

interface OrderRepositoryContext {
    knex: Knex
}


const toPersisted = (domain: Order): PersistedOrder => ({
    id: undefined,
    ticker: domain.ticker,
    quantity: domain.quantity,
    price: domain.price,
    timestamp: domain.timestamp.toISOString(),
    type: domain.type.valueOf()
})


const toDomain = (persisted: PersistedOrder): Order => ({
    ticker: persisted.ticker,
    quantity: persisted.quantity,
    price: persisted.price,
    timestamp: dayjs(persisted.timestamp),
    type: persisted.type as OrderType
})


class OrderRepository {

    constructor(
        private ctx: OrderRepositoryContext
    ) {}

    @measure
    async insert(order: Order) {
        const persisted = toPersisted(order)
        return await this.ctx.knex<PersistedOrder>('orders').insert(persisted)
    }

    @measure
    async get(ticker: string | null): Promise<Order[]> {
        const query = this.ctx.knex<PersistedOrder>('orders').select('*')

        if (ticker) {
            query.where('ticker', ticker)
        }

        const persisted = await query
        return persisted.map(toDomain)
    }

}

export default OrderRepository
