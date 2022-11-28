import Migrate from './migrate'
import Context from './context'

(async () => {
    const ctx = new Context(process.env.ENV || 'dev')
    console.time('migrations')
    await Migrate(ctx)
    console.timeEnd('migrations')
    ctx.app.start()
})()

