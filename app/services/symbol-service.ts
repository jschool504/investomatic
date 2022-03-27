import SMSClient from '../lib/clients/sms-client'
import { Symbol } from '../lib/models/domain'
import SymbolRepository from '../lib/repositories/symbol-repository'

interface SymbolServiceContext {
    symbolRepository: SymbolRepository
}

class SymbolService {

    constructor(
        private ctx: SymbolServiceContext
    ) {}

    async startWatching(ticker: string) {
        await this.ctx.symbolRepository.insert({
            ticker,
            watch: true
        })
    }

    async stopWatching(ticker: string) {
        await this.ctx.symbolRepository.update({
            ticker,
            watch: false
        })
    }

}

export default SymbolService