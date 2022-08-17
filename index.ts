import Context from './app/context'
import Migrate from './app/migrate'


console.time('ctx')
const ctx = new Context(process.env.ENV || 'dev')
console.timeEnd('ctx')


export interface ApplicationEvent {

    //cw event
    "detail-type": string | null
    url: string
    method: string
    resources: string[] | null
    headers: any
    query: any

    // sms
    body: {
        message: string
        sms: string
        subject: string
        body: string
    }
}

export async function handler(event: ApplicationEvent, context: object | null) {
    console.log('event', JSON.stringify(event))
    console.log('context', JSON.stringify(context))

    console.time('migrations')
    await Migrate(ctx)
    console.timeEnd('migrations')

    // CW event
    if (event['detail-type'] === 'Scheduled Event') {

        const { resources } = event
        const [resource] = resources || []

        if (resource.includes('retrieve-quotes-timer')) {
            const response = await ctx.quoteService.fetchQuotes(null)
            return response
        }

        if (resource.includes('retrieve-price-history-timer')) {
            const response = await ctx.historyService.fetchHistories(null)
            return response
        }

        if (resource.includes('recommendation-timer')) {
            const response = await ctx.recommendationService.buildRecommendations()
            return response
        }

        if (resource.includes('process-recommendations-timer')) {
            const response = await ctx.recommendationService.processRecommendations()
            return response
        }

    }

    // text message
    if (event.url === '/message' && event.method == 'POST') {
        const response = await ctx.smsService.handle(event)
        return response
    }

    // vanguard email
    if (event.url === '/order' && event.method == 'POST') {
        const response = await ctx.orderService.processVanguardOrderExecutionEmail(event)
        return response
    }

    console.error('Unrecognized trigger!')

}
