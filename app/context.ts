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
import Symbols from './settings'
import settings from './settings'
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


export default class Context {
    env: string

    constructor(env: string) {
        this.env = env
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
        return RecommendationService(this)
    }

    get fetch(): typeof fetch {
        return fetch
    }

    get s3Instance() {
        return new S3({
            region: 'us-east-2',
            credentials: {
                accessKeyId: settings.AWSAccessKeyId,
                secretAccessKey: settings.AWSSecretKey,
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
            username: settings.ClickSendUsername,
            password: settings.ClickSendPassword
        }
    }

    get smsClient() {
        return new SMSClient(this)
    }

    get configurationClient() {
        return new ConfigurationClient(this)
    }

    get symbols() {
        return Symbols
    }

    get recommendationEngine() {
        return new RecommendationEngine(this)
    }

    get smsService() {
        return SmsService(this)
    }

    get pgCredentials(): Knex.StaticConnectionConfig  {
        if (this.env === 'prd') {
            return settings.DatabaseCredentials
        } else {
            return {
                user: 'postgres',
                database: 'postgres',
                host: '127.0.0.1',
                port: 5432,
                password: 'password'
            }
        }
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
            connection: this.pgCredentials
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

}
