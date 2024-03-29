import { Knex } from 'knex'
import { Quote } from '../models/persistence'
import * as domain from '../models/domain'
import { measure } from '../utils'
import dayjs, { Dayjs } from 'dayjs'


const QUOTE_FIELDS = [
    'asset_type',
    'asset_main_type',
    'cusip',
    'asset_sub_type',
    'symbol',
    'description',
    'bid_price',
    'bid_size',
    'bid_id',
    'ask_price',
    'ask_size',
    'ask_id',
    'last_price',
    'last_id',
    'open_price',
    'high_price',
    'low_price',
    'bid_tick',
    'close_price',
    'net_change',
    'total_volume',
    'quote_time_in_long',
    'trade_time_in_long',
    'mark',
    'exchange',
    'exchange_name',
    'marginable',
    'shortable',
    'volatility',
    'digits',
    'fifty_two_wk_high',
    'fifty_two_wk_low',
    'nav',
    'pe_ratio',
    'div_amount',
    'div_yield',
    'div_date',
    'security_status',
    'regular_market_last_price',
    'regular_market_last_size',
    'regular_market_net_change',
    'regular_market_trade_time_in_long',
    'net_percent_change_in_double',
    'mark_change_in_double',
    'regular_market_percent_change_in_double',
    'delayed'
]


interface QuoteRepositoryContext {
    quoteDbClient: Knex.QueryBuilder<Quote>
    quotesDbClient: Knex.QueryBuilder<Quote[]>
}

const toPersisted = (domain: domain.Quote): Quote => ({
    asset_type: domain.assetType,
    asset_main_type: domain.assetMainType,
    cusip: domain.cusip,
    asset_sub_type: domain.assetSubType,
    symbol: domain.symbol,
    description: domain.description,
    bid_price: domain.bidPrice,
    bid_size: domain.bidSize,
    bid_id: domain.bidId,
    ask_price: domain.askPrice,
    ask_size: domain.askSize,
    ask_id: domain.askId,
    last_price: domain.lastPrice,
    last_size: domain.lastSize,
    last_id: domain.lastId,
    open_price: domain.openPrice,
    high_price: domain.highPrice,
    low_price: domain.lowPrice,
    bid_tick: domain.bidTick,
    close_price: domain.closePrice,
    net_change: domain.netChange,
    total_volume: domain.totalVolume,
    quote_time_in_long: domain.quoteTimeInLong,
    trade_time_in_long: domain.tradeTimeInLong,
    mark: domain.mark,
    exchange: domain.exchange,
    exchange_name: domain.exchangeName,
    marginable: domain.marginable,
    shortable: domain.shortable,
    volatility: domain.volatility,
    digits: domain.digits,
    fifty_two_wk_high: domain.fiftyTwoWkHigh,
    fifty_two_wk_low: domain.fiftyTwoWkLow,
    nav: domain.nav,
    pe_ratio: domain.peRatio,
    div_amount: domain.divAmount,
    div_yield: domain.divYield,
    div_date: domain.divDate,
    security_status: domain.securityStatus,
    regular_market_last_price: domain.regularMarketLastPrice,
    regular_market_last_size: domain.regularMarketLastSize,
    regular_market_net_change: domain.regularMarketNetChange,
    regular_market_trade_time_in_long: domain.regularMarketTradeTimeInLong,
    net_percent_change_in_double: domain.netPercentChangeInDouble,
    mark_change_in_double: domain.markChangeInDouble,
    mark_percent_change_in_double: domain.markPercentChangeInDouble,
    regular_market_percent_change_in_double: domain.regularMarketPercentChangeInDouble,
    delayed: domain.delayed
})


const toDomain = (persisted: Quote) => ({
    assetType: persisted.asset_type,
    assetMainType: persisted.asset_main_type,
    cusip: persisted.cusip,
    assetSubType: persisted.asset_sub_type,
    symbol: persisted.symbol,
    description: persisted.description,
    bidPrice: persisted.bid_price,
    bidSize: persisted.bid_size,
    bidId: persisted.bid_id,
    askPrice: persisted.ask_price,
    askSize: persisted.ask_size,
    askId: persisted.ask_id,
    lastPrice: persisted.last_price,
    lastSize: persisted.last_size,
    lastId: persisted.last_id,
    openPrice: persisted.open_price,
    highPrice: persisted.high_price,
    lowPrice: persisted.low_price,
    bidTick: persisted.bid_tick,
    closePrice: persisted.close_price,
    netChange: persisted.net_change,
    totalVolume: persisted.total_volume,
    quoteTimeInLong: persisted.quote_time_in_long,
    tradeTimeInLong: persisted.trade_time_in_long,
    mark: persisted.mark,
    exchange: persisted.exchange,
    exchangeName: persisted.exchange_name,
    marginable: persisted.marginable,
    shortable: persisted.shortable,
    volatility: persisted.volatility,
    digits: persisted.digits,
    fiftyTwoWkHigh: persisted.fifty_two_wk_high,
    fiftyTwoWkLow: persisted.fifty_two_wk_low,
    nav: persisted.nav,
    peRatio: persisted.pe_ratio,
    divAmount: persisted.div_amount,
    divYield: persisted.div_yield,
    divDate: persisted.div_date,
    securityStatus: persisted.security_status,
    regularMarketLastPrice: persisted.regular_market_last_price,
    regularMarketLastSize: persisted.regular_market_last_size,
    regularMarketNetChange: persisted.regular_market_net_change,
    regularMarketTradeTimeInLong: persisted.regular_market_trade_time_in_long,
    netPercentChangeInDouble: persisted.net_percent_change_in_double,
    markChangeInDouble: persisted.mark_change_in_double,
    markPercentChangeInDouble: persisted.mark_percent_change_in_double,
    regularMarketPercentChangeInDouble: persisted.regular_market_percent_change_in_double,
    delayed: persisted.delayed
})


class QuoteRepository {

    constructor(
        private ctx: QuoteRepositoryContext
    ) {}

    @measure
    async getQuotesBySymbols(symbols: string[]): Promise<domain.Quote[]> {

        const persisted = await this.ctx.quotesDbClient
            .select(QUOTE_FIELDS)
            .whereIn('symbol', symbols)
            .groupBy(QUOTE_FIELDS)
            .orderBy('quote_time_in_long', 'desc')
            .limit(100000)

        const i = persisted.map(toDomain)

        const quotes = symbols
            .map(
                symbol => i.find(q => symbol === q.symbol)
            )
            .filter(q => !!q)

        return quotes
    }

    @measure
    async getLatestQuoteForSymbol(symbol: string): Promise<domain.Quote> {
        const [persisted] = await this.ctx.quotesDbClient
            .select('*')
            .distinct()
            .where('symbol', symbol)
            .orderBy('quote_time_in_long', 'desc')
            .limit(1) as Quote[]

        return toDomain(persisted)
    }

    @measure
    async insert(quotes: domain.Quote[]) {
        return await this.ctx.quoteDbClient.insert(
            quotes.map(toPersisted)
        )
    }

    @measure
    async deleteBefore(before: number) {
        return await this.ctx.quoteDbClient
            .where('quote_time_in_long', '<', before)
            .delete()
    }

}


export default QuoteRepository
