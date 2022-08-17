import BrokerClient from '../lib/clients/broker-client'
import * as external from '../lib/models/external'
import { Candle } from '../lib/models/domain'
import CandleRepository from '../lib/repositories/candle-repository'
import SymbolRepository from '../lib/repositories/symbol-repository'
import { measure } from '../lib/utils'


interface HistoryServiceContext {
    symbolRepository: SymbolRepository
    brokerClient: BrokerClient
    candleRepository: CandleRepository
}


const toCandles = (history: external.History): Candle[] => {
    return history.candles.map(candle => ({
        ...candle,
        symbol: history.symbol
    }))
}


class HistoryService {

    constructor(
        private ctx: HistoryServiceContext
    ) {}

    @measure
    async getCandles(ticker: string): Promise<Candle[]> {
        const histories = await this.ctx.brokerClient.getPriceHistories([ticker])
        return histories.flatMap(toCandles)
    }

    @measure
    async fetchHistories(tickers: string[] | null) {
        const symbols = tickers || (await this.ctx.symbolRepository.getWatched()).map(({ ticker }) => ticker)
        const histories = await this.ctx.brokerClient.getPriceHistories(symbols)
        const candles = histories.flatMap(toCandles)
        return await this.ctx.candleRepository.insert(candles)
    }

}


export default HistoryService
