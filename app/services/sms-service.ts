import SymbolService from './symbol-service'
import QuoteService from './quote-service'
import HistoryService from './history-service'
import BrokerClient from '../lib/clients/broker-client'
import { Quote } from '../lib/models/domain'
import OrderService from './order-service'
import Settings from '../settings'
import RecommendationService from './recommendation-service'
import MessageClient from '../lib/interfaces/message-client'
import { measure } from '../lib/utils'

interface SmsServiceContext {
    symbolService: SymbolService
    smsClient: MessageClient
    quoteService: QuoteService
    historyService: HistoryService
    brokerClient: BrokerClient
    orderService: OrderService
    recommendationService: RecommendationService
    settings: Settings
}


interface SmsEvent {
    message: string
    sms: string | number
}


const ERROR_MESSAGE = 'Sorry, something went wrong - please try again later!'


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
    isRecommendation: (message: string) => message.startsWith('recommend'),
}


const getTicker = (command: string) =>
    (message: string) => message
        .replace(`${command} `, '')
        .toUpperCase()


const handleError = (func: ExecutorFunction<string, Promise<string>>): ExecutorFunction<string, Promise<string>> =>
    async (message: string): Promise<string> => {
        try {
            return await func(message)
        } catch (e) {
            console.error(e)
            return Promise.resolve(ERROR_MESSAGE)
        }
    }

const Operations = (ctx: SmsServiceContext): { [key: string]: ExecutorFunction<string, Promise<string>> } => ({
    startWatchingTicker: handleError(async (message: string) => {
        const ticker = getTicker('watch')(message)
        await ctx.symbolService.startWatching(ticker)
        await ctx.quoteService.fetchQuotes([ticker])
        await ctx.historyService.fetchHistories([ticker])
        return `Started watching ${ticker} 👀`
    }),
    stopWatchingTicker: handleError(async (message: string) => {
        const ticker = getTicker('stop watching')(message)
        await ctx.symbolService.stopWatching(ticker)
        return 'No longer watching ' + ticker
    }),
    getQuote: handleError(async (message: string) => {
        const ticker = getTicker('quote')(message)
        const quotes: Quote[] = await ctx.brokerClient.getQuotes([ticker])
        const [quote] = quotes
        return `${ticker} is currently $${quote.askPrice.toFixed(2)}\n`
            + `* it's 52 week high is $${quote.fiftyTwoWkHigh.toFixed(2)}\n`
            + `* and it's 52 week low is $${quote.fiftyTwoWkLow.toFixed(2)}\n`
    }),
    getHoldingCost: handleError(async (message: string) => {
        const ticker = getTicker('holding cost')(message)
        const value = await ctx.orderService.getHoldingCost(ticker)
        return `You've invested $${value.toFixed(2)} in ${ticker}`
    }),
    getTotalHoldingCost: handleError(async (message: string) => {
        const value = await ctx.orderService.getHoldingCost(null)
        return `You've invested $${value.toFixed(2)}`
    }),
    getHoldingValue: handleError(async (message: string) => {
        const ticker = getTicker('holding value')(message)
        const value = await ctx.orderService.getHoldingValue(ticker)
        return `Your shares of ${ticker} are currently worth $${value.toFixed(2)}`
    }),
    getRecommendation: handleError(async (message: string) => {
        const ticker = getTicker('recommend')(message)

        await ctx.historyService.fetchHistories([ticker])
        await ctx.quoteService.fetchQuotes([ticker])
        await ctx.recommendationService.buildRecommendations([ticker], true)
        await ctx.recommendationService.processRecommendations()

        return null
    })
})


export default class SmsService {

    constructor(
        private ctx: SmsServiceContext
    ) {}

    @measure
    async handle(event: SmsEvent) {

        const response = await Match<string, Promise<string | null>>(event.message.toLowerCase())(
            [MessageIdentifiers.isWatch,            Operations(this.ctx).startWatchingTicker],
            [MessageIdentifiers.isStopWatching,     Operations(this.ctx).stopWatchingTicker],
            [MessageIdentifiers.isQuote,            Operations(this.ctx).getQuote],
            [MessageIdentifiers.isHoldingCost,      Operations(this.ctx).getHoldingCost],
            [MessageIdentifiers.isTotalHoldingCost, Operations(this.ctx).getTotalHoldingCost],
            [MessageIdentifiers.isHoldingValue,     Operations(this.ctx).getHoldingValue],
            [MessageIdentifiers.isRecommendation,   Operations(this.ctx).getRecommendation],
            [Always, async () => 'Sorry! Not sure what you asked :('],
        )

        if (response) {
            return await this.ctx.smsClient.send(response)
        }

    }

}
