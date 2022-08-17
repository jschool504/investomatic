import assert from 'assert'
import fetch from 'node-fetch'
import BrokerClient from './broker-client'
import { mock } from 'ts-mockito'

describe('BrokerClient', () => {

    describe('when getting price histories', () => {

        it.skip('should return price histories', async () => {

            const fakeFetch: any = () => {}

            const brokerClient = new BrokerClient({
                fetch: fakeFetch
            })

            const actual = await brokerClient.getPriceHistories(['ACES'])

            console.log(actual)

        })
        
    })

})
