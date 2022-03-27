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

    console.time('service timer')

    // CW event
    if (event['detail-type'] === 'Scheduled Event') {

        const { resources } = event
        const [resource] = resources || []

        if (resource.includes('retrieve-quotes-timer')) {
            const response = await ctx.quoteService.fetchQuotes(null)
            console.timeEnd('service timer')
            return response
        }

        if (resource.includes('retrieve-price-history-timer')) {
            const response = await ctx.historyService.fetchHistories(null)
            console.timeEnd('service timer')
            return response
        }

        if (resource.includes('recommendation-timer')) {
            const response = await ctx.recommendationService.buildRecommendations()
            console.timeEnd('service timer')
            return response
        }

        if (resource.includes('process-recommendations-timer')) {
            const response = await ctx.recommendationService.processRecommendations()
            console.timeEnd('service timer')
            return response
        }

    }

    // text message
    if (event.url === '/message' && event.method == 'POST') {
        const response = await ctx.smsService.handle(event)
        console.timeEnd('service timer')
        return response
    }

    // vanguard email
    if (event.url === '/order' && event.method == 'POST') {
        const response = await ctx.orderService.processVanguardOrderExecutionEmail(event)
        console.timeEnd('service timer')
        return response
    }

    console.error('Unrecognized trigger!')

}
