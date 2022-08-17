import SymbolRepository from '../lib/repositories/symbol-repository'
import { measure } from '../lib/utils'

interface SymbolServiceContext {
    symbolRepository: SymbolRepository
}

class SymbolService {

    constructor(
        private ctx: SymbolServiceContext
    ) {}

    @measure
    async startWatching(ticker: string) {
        await this.ctx.symbolRepository.insert({
            ticker,
            watch: true
        })
    }

    @measure
    async stopWatching(ticker: string) {
        await this.ctx.symbolRepository.update({
            ticker,
            watch: false
        })
    }

}

export default SymbolService