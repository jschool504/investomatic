import Context from '../app/context'
import { Candle } from '../app/lib/models/persistence'


(async () => {
    const SYMBOL = 'VOO'

    const ctx = new Context('dev')

    const candles: Candle[] = await ctx.candlesDbClient
        .select()
        .where('symbol', SYMBOL)
        .groupBy('symbol', 'open', 'high', 'low', 'close', 'volume', 'datetime')


    console.log(JSON.stringify(candles, null, 2))

    await ctx.candlesDbClient.delete().where('symbol', SYMBOL)
    await ctx.candlesDbClient.insert(candles)

    process.exit(0)

})()
