const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')
const express = require('express')
const { awsCredentials, FunctionName } = require('./app/credentials.json')

const client = new LambdaClient({
    region: 'us-east-2',
    credentials: awsCredentials
})

const asciiDecoder = new TextDecoder('ascii')

const app = express()

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: false })) // for parsing application/x-www-form-urlencoded

app.get('/status', (req, res) => {
    res.send({
        ok: true
    })
})

app.post('/*', async (req, res) => {
    console.log('request: ', req.headers)
    console.log('request: ', JSON.stringify(req.body, null, 2))
    const command = new InvokeCommand({
        FunctionName: FunctionName,
        Payload: JSON.stringify({
            url: req.url,
            method: req.method,
            headers: req.headers,
            query: req.query,
            body: req.body
        })
    })
    const result = await client.send(command)
    const decodedResult = asciiDecoder.decode(result.Payload)
    console.log('response', decodedResult)
    res.send({
        ok: true
    })
})

app.listen(8000, () => console.log('listening on 8000'))
