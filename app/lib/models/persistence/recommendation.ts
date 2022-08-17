export default interface Recommendation {
    symbol: string
    ask_price: number
    three_month_percent: number
    year_percent: number
    interpolated_price_percentage: number
    interval_progress_weight: number
    combined_and_weighted_price_percentage: number
    range_high: number
    range_low: number
    buy: boolean
    processed: boolean
    created_at: string
    fifty_two_wk_high: number
    send_message: boolean
}
