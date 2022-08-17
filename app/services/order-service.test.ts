import assert from 'assert'
import dayjs from 'dayjs'
import { stubInterface } from 'ts-sinon'
import SMSClient from '../lib/clients/sms-client'
import { Order } from '../lib/models/domain'
import OrderType from '../lib/models/domain/order-type'
import OrderRepository from '../lib/repositories/order-repository'
import QuoteRepository from '../lib/repositories/quote-repository'
import OrderService from './order-service'


const PURCHASE_EMAIL_BODY = `
**************

Vanguard Group

**************

https://investor.vanguard.com/home?oeaut=CEtSmoqFOZ

Notice of a brokerage order execution

Dear Jeremy School,

The following order executed on 06/30/2022 at 1:27 PM, Eastern time: 

Account: <b>9758</b>

Transaction type: <b>Buy</b>

Order type: <b>Market</b>

Security: <b>VANGUARD S&P 500 INDEX ETF (VOO)</b>

Quantity: <b>1 share(s)</b>

Price:* <b>$348.27</b>

*Some prices may be truncated. If your order executes in multiple lots, the 
price shown represents the average execution price. For full details, see the 
trade confirmation for this order.

No further action is required of you at this time. However, if you have 
questions about your account activity or you didn't request this order and 
suspect fraud, please
------------
|Contact us|
------------

https://personal.vanguard.com/web/c1/service-center-contact-us/topic/rta
.

Manage alerts

To customize your preferences or unsubscribe from alerts, follow these steps:

* Log on to your account. 
 * From the My Accounts tab, select Profile & Account Settings. 
 * Under Alerts, select Account activity alerts.
For more information about online account protection, visit our Security 
Center onvanguard.com 
https://www.vanguard.com/.

Thank you for investing with Vanguard.

------------------------------------------
| Legal notices and email administration |
------------------------------------------

All investing is subject to risk, including the possible loss of the money you 
invest.

Vanguard funds not held in brokerage account are held by The Vanguard Group, 
Inc., and are not protected by SIPC. Vanguard Brokerage Services is a division 
of Vanguard Marketing Corporation, member FINRA and SIPC.

(c) 2022 The Vanguard Group, Inc. All rights reserved.

P3378

Privacy policy 
https://investor.vanguard.com/investing/privacy-policy?oeaut=zSXXiBDenC
 | Contact us 
https://personal.vanguard.com/web/cf/service-center-contact-us/?oeaut=fYanqEZqzl
 | Site security 
https://investor.vanguard.com/security/?oeaut=PayIGEjMDN
 | Home 
https://investor.vanguard.com/home?oeaut=SuWyzPOOXC
`

const SELL_EMAIL_BODY = `
**************

Vanguard Group

**************

https://investor.vanguard.com/home?oeaut=CEtSmoqFOZ

Notice of a brokerage order execution

Dear Jeremy School,

The following order executed on 06/30/2022 at 1:27 PM, Eastern time: 

Account: <b>9758</b>

Transaction type: <b>Sell</b>

Order type: <b>Market</b>

Security: <b>VANGUARD S&P 500 INDEX ETF (VOO)</b>

Quantity: <b>1 share(s)</b>

Price:* <b>$348.27</b>

*Some prices may be truncated. If your order executes in multiple lots, the 
price shown represents the average execution price. For full details, see the 
trade confirmation for this order.

No further action is required of you at this time. However, if you have 
questions about your account activity or you didn't request this order and 
suspect fraud, please
------------
|Contact us|
------------

https://personal.vanguard.com/web/c1/service-center-contact-us/topic/rta
.

Manage alerts

To customize your preferences or unsubscribe from alerts, follow these steps:

* Log on to your account. 
 * From the My Accounts tab, select Profile & Account Settings. 
 * Under Alerts, select Account activity alerts.
For more information about online account protection, visit our Security 
Center onvanguard.com 
https://www.vanguard.com/.

Thank you for investing with Vanguard.

------------------------------------------
| Legal notices and email administration |
------------------------------------------

All investing is subject to risk, including the possible loss of the money you 
invest.

Vanguard funds not held in brokerage account are held by The Vanguard Group, 
Inc., and are not protected by SIPC. Vanguard Brokerage Services is a division 
of Vanguard Marketing Corporation, member FINRA and SIPC.

(c) 2022 The Vanguard Group, Inc. All rights reserved.

P3378

Privacy policy 
https://investor.vanguard.com/investing/privacy-policy?oeaut=zSXXiBDenC
 | Contact us 
https://personal.vanguard.com/web/cf/service-center-contact-us/?oeaut=fYanqEZqzl
 | Site security 
https://investor.vanguard.com/security/?oeaut=PayIGEjMDN
 | Home 
https://investor.vanguard.com/home?oeaut=SuWyzPOOXC
`


const PURCHASE_EMAIL = {
    body: {
        subject: 'Notice of a brokerage order execution',
        body: PURCHASE_EMAIL_BODY
    }
}

const SELL_EMAIL = {
    body: {
        subject: 'Notice of a brokerage order execution',
        body: SELL_EMAIL_BODY
    }
}


describe('OrderService', () => {

    describe('when an order execution email is received', () => {

        describe('and it is for a purchase order', () => {

            it('should record a purchase order', async () => {

                const fakeOrderRepository = stubInterface<OrderRepository>()
                const fakeSmsClient = stubInterface<SMSClient>()
                const fakeQuoteRepository = stubInterface<QuoteRepository>()

                const orderService = new OrderService({
                    orderRepository: fakeOrderRepository,
                    smsClient: fakeSmsClient,
                    quoteRepository: fakeQuoteRepository,
                })

                await orderService.processVanguardOrderExecutionEmail(PURCHASE_EMAIL)

                const expected: Order = {
                    ticker: 'VOO',
                    quantity: 1,
                    price: 348.27,
                    timestamp: dayjs.tz('2022-06-30T01:27:00', 'America/New_York'),
                    type: OrderType.BUY
                }

                const [{ args: [callArgs] }] = fakeOrderRepository.insert.getCalls()
                assert.deepEqual(callArgs, expected)

            })

        })

        describe('and it is for a sell order', () => {
            
            it('should record a sell order', () => {

                const fakeOrderRepository = stubInterface<OrderRepository>()
                const fakeSmsClient = stubInterface<SMSClient>()
                const fakeQuoteRepository = stubInterface<QuoteRepository>()

                const orderService = new OrderService({
                    orderRepository: fakeOrderRepository,
                    smsClient: fakeSmsClient,
                    quoteRepository: fakeQuoteRepository,
                })

                orderService.processVanguardOrderExecutionEmail(SELL_EMAIL)

                const expected: Order = {
                    ticker: 'VOO',
                    quantity: 1,
                    price: 348.27,
                    timestamp: dayjs.tz('2022-06-30T01:27:00', 'America/New_York'),
                    type: OrderType.SELL
                }

                const [{ args: [callArgs] }] = fakeOrderRepository.insert.getCalls()
                assert.deepEqual(callArgs, expected)

            })

        })

    })

})
