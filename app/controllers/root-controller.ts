import { Request, Response } from 'express'
import { measure } from '../lib/utils'
import OrderService from '../services/order-service'
import SmsService from '../services/sms-service'


interface RootControllerContext {
    smsService: SmsService
    orderService: OrderService
}


interface VanguardOrderMessageBody {
    subject: string
    body: string
}


export default class RootController {

    constructor(
        private ctx: RootControllerContext
    ) {}

    @measure
    async status(request: Request, response: Response) {
        response.send({
            ok: true
        })
    }

    @measure
    async message(request: Request, response: Response) {
        try {
            const result = await this.ctx.smsService.handle(request.body)
            response.send(result)
        } catch (e) {
            response.send({
                message: "error processing message",
                error: e.toString()
            })
        }
    }

    @measure
    async order(request: Request, response: Response) {
        const body = request.body as VanguardOrderMessageBody
        try {
            await this.ctx.orderService.processVanguardOrderExecutionEmail({
                body: {
                    subject: body.subject,
                    body: body.body
                }
            })
            response.send({
                ok: true
            })
        } catch (e) {
            response.send({
                message: "error processing message",
                error: e.toString()
            })
        }
    }

}
