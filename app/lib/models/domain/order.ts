import { Dayjs } from 'dayjs'
import OrderType from './order-type'

export default interface Order {
    ticker: string
    quantity: number
    price: number
    timestamp: Dayjs
    type: OrderType
}
