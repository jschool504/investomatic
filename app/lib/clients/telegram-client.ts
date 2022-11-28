import TelegramBot from 'node-telegram-bot-api'
import Settings from '../../settings'
import MessageClient from '../interfaces/message-client'
import { measure } from '../utils'

interface TelegramClientContext {
    telegramBot: TelegramBot
    settings: Settings
}

export default class TelegramClient implements MessageClient {

    constructor(
        private ctx: TelegramClientContext
    ) {}

    @measure
    async send(message: string) {
        await this.ctx.telegramBot.sendMessage(this.ctx.settings.TelegramChatId, message)
    }

}
