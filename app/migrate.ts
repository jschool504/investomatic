import fs from 'fs'
import { Knex } from 'knex'


interface MigrationContext {
    knex: Knex
}

interface Migration {
    version: string,
    sql: string
}

export default async (ctx: MigrationContext) => {
    try {
        const exists = await ctx.knex.schema.hasTable('migrations')
        console.log('Checking for migrations table...')
        if (!exists) {
            console.log('No migrations table found, creating...')
            await ctx.knex.schema.createTable('migrations', table => {
                table.text('version').notNullable().primary()
                table.text('sql')
            })
            console.log('Migrations table created.')
        }
        const completedMigrations = await ctx.knex<Migration>('migrations').select('version', 'sql')

        const migrationFiles: string[] = fs.readdirSync('./app/migrations')

        const migrations = migrationFiles
            .reduce(
                (migrations: Migration[], filename) => ([
                    ...migrations,
                    {
                        version: filename,
                        sql: fs.readFileSync(`./app/migrations/${filename}`).toString()
                    }
                ]),
                []
            )
            .filter(
                migration => !completedMigrations.some(completedMigration => completedMigration.version == migration.version)
            )

        for (const migration of migrations) {
            try {
                console.log('Running migration, ' + migration.version)
                await ctx.knex.raw(migration.sql)
                await ctx.knex<Migration>('migrations').insert(migration)
            } catch (e) {
                console.error(e)
            }
        }
        console.log('Migrations completed.')


    } catch (e) {
        console.log(e)
    }
}
