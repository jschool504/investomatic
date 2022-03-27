import SMSClient from '../lib/clients/sms-client'
import SymbolService from './symbol-service'
import QuoteService from './quote-service'
import HistoryService from './history-service'
import BrokerClient from '../lib/clients/broker-client'
import { Quote } from '../lib/models/domain'
import OrderService from './order-service'
import Settings from '../settings'

interface SmsServiceContext {
    symbolService: SymbolService
    smsClient: SMSClient
    quoteService: QuoteService
    historyService: HistoryService
    brokerClient: BrokerClient
    orderService: OrderService
}


interface SmsEvent {
   body: {
        message: string
        sms: string
   }
}


type ConditionalFunction<T> = (value: T) => boolean
type ExecutorFunction<T, V> = (value: T) => V
const Identity = <T>(value: T) => value
const Always = <T>(value: T) => true
const Never = <T>(value: T) => false

function Match<T, V>(value: T) {
    function thing(...args: [ConditionalFunction<T>, ExecutorFunction<T, V>][]): V {
        for (const [conditional, executor] of args) {
            if (conditional(value)) {
                return executor(value)
            }
        }
    }
    return thing
}



const MessageIdentifiers = {
    isWatch: (message: string) => message.startsWith('watch'),
    isStopWatching: (message: string) => message.startsWith('stop watching'),
    isQuote: (message: string) => message.startsWith('quote'),
    isTotalHoldingCost: (message: string) => message.startsWith('holding cost') || message.startsWith('total holding cost'),
    isHoldingCost: (message: string) => message.startsWith('holding cost '),
    isHoldingValue: (message: string) => message.startsWith('holding value'),
}


const getTicker = (command: string) =>
    (message: string) => message
        .replace(`${command} `, '')
        .toUpperCase()


const Operations = (ctx: SmsServiceContext): { [key: string]: ExecutorFunction<string, Promise<string>> } => ({
    startWatchingTicker: async (message: string) => {
        const ticker = getTicker('watch')(message)
        await ctx.symbolService.startWatching(ticker)
        await ctx.quoteService.fetchQuotes([ticker])
        await ctx.historyService.fetchHistories([ticker])
        return `Started watching ${ticker} 👀`
    },
    stopWatchingTicker: async (message: string) => {
        const ticker = getTicker('stop watching')(message)
        await ctx.symbolService.stopWatching(ticker)
        return 'No longer watching ' + ticker
    },
    getQuote: async (message: string) => {
        const ticker = getTicker('quote')(message)
        const quotes: Quote[] = await ctx.brokerClient.getQuotes([ticker])
        const [quote] = quotes
        return `${ticker} is currently $${quote.askPrice.toFixed(2)}\n`
            + `* it's 52 week high is $${quote.fiftyTwoWkHigh.toFixed(2)}\n`
            + `* and it's 52 week low is $${quote.fiftyTwoWkLow.toFixed(2)}\n`
    },
    getHoldingCost: async (message: string) => {
        const ticker = getTicker('holding cost')(message)
        const value = await ctx.orderService.getHoldingCost(ticker)
        return `You've invested $${value.toFixed(2)} in ${ticker}`
    },
    getTotalHoldingCost: async (message: string) => {
        const value = await ctx.orderService.getHoldingCost(null)
        return `You've invested $${value.toFixed(2)}`
    },
    getHoldingValue: async (message: string) => {
        const ticker = getTicker('holding value')(message)
        const value = await ctx.orderService.getHoldingValue(ticker)
        return `Your shares of ${ticker} are currently worth $${value.toFixed(2)}`
    }
})


const SmsService = (ctx: SmsServiceContext) => ({

    handle: async (event: SmsEvent) => {

        if (event.body.sms === Settings.Phone) {

            const response = await Match<string, Promise<string>>(event.body.message.toLowerCase())(
                [MessageIdentifiers.isWatch,            Operations(ctx).startWatchingTicker],
                [MessageIdentifiers.isStopWatching,     Operations(ctx).stopWatchingTicker],
                [MessageIdentifiers.isQuote,            Operations(ctx).getQuote],
                [MessageIdentifiers.isHoldingCost,      Operations(ctx).getHoldingCost],
                [MessageIdentifiers.isTotalHoldingCost, Operations(ctx).getTotalHoldingCost],
                [MessageIdentifiers.isHoldingValue,     Operations(ctx).getHoldingValue],
                [Always, async () => 'Sorry, not sure what you asked :('],
            )

            return await ctx.smsClient.send(response)
        }
    }

})


export default SmsService
