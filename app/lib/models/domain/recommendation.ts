export default interface Recommendation {
    symbol: string
    askPrice: number
    threeMonthPercent: number
    yearPercent: number
    interpolatedPricePercentage: number
    intervalProgressWeight: number
    combinedAndWeightedPricePercentage: number
    range: {
        high: number
        low: number
    }
    buy: boolean
    processed: boolean
    createdAt: string,
    fiftyTwoWkHigh: number,
    sendMessage: boolean
}
