interface Candle {
    open: number
    high: number
    low: number
    close: number
    volume: number
    datetime: number
}

interface History {
    candles: Candle[]
    symbol: string
    empty: boolean
}

export default History
