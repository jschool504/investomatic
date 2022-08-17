export default interface Order {
    id: number | undefined
    ticker: string
    quantity: number
    price: number
    timestamp: string
    type: string
}
