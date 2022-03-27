import assert from 'assert'
import RecommendationEngine from './recommendation-engine'


const BASE_QUOTE = {
    askPrice: 15,
    fiftyTwoWkHigh: 100,
    fiftyTwoWkLow: 15
}


const BASE_CANDLES = [
    { close: 75 }, // 3mo high
    { close: 25 } // 3mo low
]


const TEST_CASES = [
    [
        'starts month at 52wk low',
        BASE_QUOTE,
        BASE_CANDLES,
        1/31,
        true
    ],

    [
        'starts month at 52wk high',
        { ...BASE_QUOTE, askPrice: 100 },
        BASE_CANDLES,
        1/31,
        false
    ],

    [
        'starts month at 3mo low',
        { ...BASE_QUOTE, askPrice: 25 },
        BASE_CANDLES,
        1/31,
        true
    ],

    [
        'starts month at 3mo high',
        { ...BASE_QUOTE, askPrice: 75 },
        BASE_CANDLES,
        1/31,
        false
    ],

    [
        'gets to 15th of month at 52wk high',
        { ...BASE_QUOTE, askPrice: 100 },
        BASE_CANDLES,
        15/31,
        false
    ],

    [
        'gets to 15th of month at 3mo high',
        { ...BASE_QUOTE, askPrice: 75 },
        BASE_CANDLES,
        15/31,
        false
    ],

    [
        'gets to 15th of month at 3mo low',
        { ...BASE_QUOTE, askPrice: 25 },
        BASE_CANDLES,
        15/31,
        true
    ],

    [
        'gets to 31st of month at 52wk high',
        { ...BASE_QUOTE, askPrice: 100 },
        BASE_CANDLES,
        31/31,
        false
    ],

    [
        'gets to 31st of month at 3mo high',
        { ...BASE_QUOTE, askPrice: 75 },
        BASE_CANDLES,
        31/31,
        false
    ],

    [
        'gets to 31st of month at 3mo low',
        { ...BASE_QUOTE, askPrice: 25 },
        BASE_CANDLES,
        31/31,
        true
    ],

    [
        'gets to 31st of month at 52wk low',
        { ...BASE_QUOTE, askPrice: 15 },
        BASE_CANDLES,
        31/31,
        true
    ],

]


describe('RecommendationEngine', () => {

    const engine = new RecommendationEngine({})

    describe('getRecommendation', () => {

        const verifyRecommendation = (quote, history, intervalProgress, expectedRecommendation) => assert.equal(
            engine.getRecommendation(quote, history, intervalProgress).buy,
            expectedRecommendation
        )

        TEST_CASES.forEach(testData => {

            const [name, quote, history, intervalPercentage, shouldBuy] = testData

            describe(name.toString(), () => {

                const buyText = shouldBuy ? 'buying' : 'not buying'

                it('should recommend ' + buyText, () => {

                    verifyRecommendation(quote, history, intervalPercentage, shouldBuy)

                })

            })

        })

    })

})
