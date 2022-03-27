import { Dayjs } from 'dayjs'

export default interface Order {
    ticker: string
    quantity: number
    price: number
    timestamp: Dayjs
}
