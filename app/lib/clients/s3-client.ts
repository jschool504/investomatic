import dayjs from 'dayjs'
import {
    S3,
    PutObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command, 
    SelectObjectContentCommandInput
} from '@aws-sdk/client-s3'
import { measure } from '../utils'


interface S3ClientContext {
    s3Instance: S3
}


export default class S3Client {
    private _s3Client: S3

    constructor(ctx: S3ClientContext) {
        this._s3Client = ctx.s3Instance
    }

    @measure
    select(query: string): any {
        const request: SelectObjectContentCommandInput = {
            Bucket: 'investomatic-db',
            Key: 'db.psv',
            Expression: query,
            ExpressionType: 'SQL',
            InputSerialization: {
            CSV: {
                FileHeaderInfo: "NONE",
                RecordDelimiter: "\n",
                FieldDelimiter: "|"
            }
            },
            OutputSerialization: {
                JSON: {}
            }
        }
        return this._s3Client.selectObjectContent(request)
    }

    set(namespace: string, key: string, body: string) {
        this._s3Client.send(
            new PutObjectCommand({
                Body: body,
                Bucket: namespace,
                Key: key
            })
        )
    }

    async list(namespace: string, filter: string): Promise<string[]> {
        try {
            const response = await this._s3Client.send(
                new ListObjectsV2Command({
                    Bucket: namespace,
                    Prefix: filter
                })
            )
            const results = JSON.parse(JSON.stringify(response.Contents))
            const keys = results
                .sort((item1, item2) => dayjs(item2.LastModified).unix() - dayjs(item1.LastModified).unix())
                .map(({ Key }) => Key)
            return keys
        } catch (e) {
            return []
        }
    }

    async get(namespace: string, key: string): Promise<string> {
        return await new Promise(async (resolve, reject) => {

            try {
                const response = await this._s3Client.send(
                    new GetObjectCommand({
                        Bucket: namespace,
                        Key: key
                    })
                )
        
                const chunks = []

                // @ts-ignore
                response.Body.on('data', (chunk) => chunks.push(chunk))
                // @ts-ignore
                response.Body.once('end', () => resolve(chunks.join('')))

            } catch (e) {
                console.error(e)
                resolve(null)
            }

        })
    }

}
