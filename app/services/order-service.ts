import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import SMSClient from '../lib/clients/sms-client'
import { Order } from '../lib/models/domain'
import OrderRepository from '../lib/repositories/order-repository'
import QuoteRepository from '../lib/repositories/quote-repository'

interface OrderServiceContext {
    orderRepository: OrderRepository
    smsClient: SMSClient
    quoteRepository: QuoteRepository
}


interface VanguardBrokerageOrderExecutionEmailEvent {
    body: string
    subject: string
}


class OrderService {

    constructor(
        private ctx: OrderServiceContext
    ) {
        dayjs.extend(customParseFormat)
        dayjs.extend(utc)
        dayjs.extend(timezone)
    }

    async processVanguardOrderExecutionEmail(
        event: { body: VanguardBrokerageOrderExecutionEmailEvent }
    ) {
        const [date] = event.body.body.match(/\d+\/\d+\/\d+\s(at)\s\d+\:\d+\s(AM|PM)\,\s[A-Za-z]+\s(time)/g)
        const timestamp = dayjs.tz(date, 'MM/DD/YYYY [at] h:mm', 'America/New_York')
        const order: Order = {
            ticker: event.body.body.match(/(?<=\()[A-Z]+(?!\<)/g)[0],
            quantity: parseInt(event.body.body.match(/\d+(?=(\s(share)))/g)[0]),
            price: parseFloat(event.body.body.match(/(?<=\$)\d+\.\d+/g)[0]),
            timestamp: timestamp
        }
        await this.ctx.orderRepository.insert(order)
        await this.ctx.smsClient.send(`Your purchase of ${order.quantity} share(s) of ${order.ticker} just went through at $${order.price}!🎉`)
        return Promise.resolve(null)
    }

    async getHoldingCost(ticker: string | null): Promise<number> {
        const orders = await this.ctx.orderRepository.get(ticker)
        return orders
            .reduce(
                (sum, order) => sum + (order.price * order.quantity),
                0
            )
    }

    async getHoldingValue(ticker: string | null): Promise<number> {
        const orders = await this.ctx.orderRepository.get(ticker)
        const [quote] = await this.ctx.quoteRepository.getQuotesBySymbols([ticker])
        return orders
            .reduce(
                (sum, order) => sum + (quote.mark * order.quantity),
                0
            )
    }

}

export default OrderService
