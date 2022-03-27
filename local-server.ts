import express, { Request, Response } from 'express'
import { handler } from '.'

// const asciiDecoder = new TextDecoder('ascii')

const app = express()

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: false })) // for parsing application/x-www-form-urlencoded

app.get('/status', (req, res) => {
    res.send({
        ok: true
    })
})

app.post('/*', async (req: Request, res: Response) => {
    console.log(req.body)
    handler({
        ...req.body,
        method: 'POST',
        url: req.url,
    }, null)
    res.send({
        ok: true
    })
})

app.listen(8000, () => console.log('listening on 8000'))
