import express from 'express'
import fetch from 'node-fetch'
import { S3 } from '@aws-sdk/client-s3'
import BrokerClient from './lib/clients/broker-client'
import S3Client from './lib/clients/s3-client'
import SMSClient from './lib/clients/sms-client'
import ConfigurationClient from './lib/clients/configuration-client'
import RecommendationEngine from './lib/engines/recommendation-engine'
import QuoteRepository from './lib/repositories/quote-repository'
import SmsService from './services/sms-service'
import QuoteService from './services/quote-service'
// import Symbols from './settings'
import knex, { Knex } from 'knex'
import * as persistence from './lib/models/persistence'
import HistoryService from './services/history-service'
import CandleRepository from './lib/repositories/candle-repository'
import RecommendationService from './services/recommendation-service'
import RecommendationRepository from './lib/repositories/recommendation-repository'
import { memo } from './lib/utils'
import SymbolService from './services/symbol-service'
import SymbolRepository from './lib/repositories/symbol-repository'
import OrderService from './services/order-service'
import OrderRepository from './lib/repositories/order-repository'
import Settings, { SettingsManager } from './settings'
import MessageClient from './lib/interfaces/message-client'
import RootController from './controllers/root-controller'
import Scheduler from './controllers/scheduler'
import TelegramBot from 'node-telegram-bot-api'
import TelegramClient from './lib/clients/telegram-client'


const EVERY_MINUTE = 60000
const EVERY_HOUR = 3600000
const EVERY_DAY = 1440000
const EVERY_SECOND = 1000


export default class Context {
    env: string

    constructor(env: string) {
        this.env = env
    }

    @memo()
    getTelegramBot() {
        const bot = new TelegramBot(this.settings.TelegramToken, { polling: true })

        bot.on('text', async (msg) => {
            console.log(msg.text)
            const chatId = msg.chat.id
            await this.smsService.handle({
                message: msg.text || '',
                sms: chatId
            })
        })

        return bot
    }

    get telegramBot() {
        const bot = this.getTelegramBot()
        return bot
    }

    get quoteRepository() {
        return new QuoteRepository(this)
    }

    get quoteDbClient() {
        return this.knex<persistence.Quote>('quotes')
    }

    get quotesDbClient() {
        return this.knex<persistence.Quote[]>('quotes')
    }

    get quoteService() {
        return new QuoteService(this)
    }

    get candleRepository() {
        return new CandleRepository(this)
    }

    get candlesDbClient() {
        return this.knex<persistence.Candle[]>('candles')
    }

    get candleDbClient() {
        return this.knex<persistence.Candle>('candles')
    }

    get historyService() {
        return new HistoryService(this)
    }

    get recommendationsDbClient() {
        return this.knex<persistence.Recommendation[]>('recommendations')
    }

    get recommendationRepository() {
        return new RecommendationRepository(this)
    }

    get recommendationService() {
        return new RecommendationService(this)
    }

    get fetch(): typeof fetch {
        return fetch
    }

    get s3Instance() {
        return new S3({
            region: 'us-east-2',
            credentials: {
                accessKeyId: this.settings.AWSAccessKeyId,
                secretAccessKey: this.settings.AWSSecretKey,
            }
        })
    }

    get s3Client() {
        return new S3Client(this)
    }

    get brokerClient() {
        return new BrokerClient(this)
    }

    get clickSendCredentials(): { username: string, password: string } {
        return {
            username: this.settings.ClickSendUsername,
            password: this.settings.ClickSendPassword
        }
    }

    get smsClient(): MessageClient {
        return new TelegramClient(this)
    }

    // get smsClient(): MessageClient {
    //     return new SMSClient(this)
    // }

    get configurationClient() {
        return new ConfigurationClient(this)
    }

    get recommendationEngine() {
        return new RecommendationEngine(this)
    }

    get smsService() {
        return new SmsService(this)
    }

    get pgCredentials(): Knex.StaticConnectionConfig  {
        return this.settings.DatabaseCredentials
    }

    get symbolDbClient() {
        return this.knex<persistence.Symbol>('symbols')
    }

    get symbolRepository() {
        return new SymbolRepository(this)
    }

    get symbolService() {
        return new SymbolService(this)
    }

    @memo()
    _knex() {
        return knex({
            client: 'pg',
            connection: this.pgCredentials,
            debug: true
        })
    }

    get knex() {
        return this._knex()
    }

    get orderRepository() {
        return new OrderRepository(this)
    }

    get orderService() {
        return new OrderService(this)
    }

    get settings(): Settings {
        return new SettingsManager(this).get()
    }

    get scheduler() {
        const scheduler = new Scheduler()

        scheduler.add({
            runOnStart: true,
            interval: EVERY_DAY,
            function: async () => {
                await this.quoteService.cleanUp()
            }
        })

        // retrieve quotes
        scheduler.add({
            runOnStart: true,
            interval: EVERY_MINUTE,
            function: async () => {
                const response = await this.quoteService.fetchQuotes(this.settings.DefaultSymbols)
                console.log(response)
            }
        })

        // price history
        scheduler.add({
            runOnStart: true,
            interval: EVERY_DAY,
            function: async () => {
                const response = await this.historyService.fetchHistories(this.settings.DefaultSymbols)
                console.log(response)
            }
        })

        // build recommendations
        scheduler.add({
            runOnStart: true,
            interval: EVERY_HOUR,
            function: async () => {
                const response = await this.recommendationService.buildRecommendations()
                console.log(response)
            }
        })

        // send recommendations out
        scheduler.add({
            runOnStart: true,
            interval: EVERY_MINUTE,
            function: async () => {
                const response = await this.recommendationService.processRecommendations()
                console.log(response)
            }
        })

        return scheduler
    }

    get rootController() {
        return new RootController(this)
    }

    get server() {
        const server = express()

        server.use(express.json()) // for parsing application/json
        server.use(express.urlencoded({ extended: false })) // for parsing application/x-www-form-urlencoded

        // console.log(__dirname + '/assets')

        server.use(express.static(__dirname + '/assets'))

        server.get('/', this.rootController.status.bind(this.rootController))
        server.post('/message', this.rootController.message.bind(this.rootController))
        server.post('/order', this.rootController.order.bind(this.rootController))

        return server
    }

    get app() {
        return {
            start: () => {
                this.telegramBot
                this.scheduler.start()
                this.server.listen(
                    this.settings.port,
                    () => console.log(`Investomatic running on ${this.settings.port}`)
                )
            }
        }
    }

}
