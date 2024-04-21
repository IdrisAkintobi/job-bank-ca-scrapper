import { Module, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import { DbService } from '../services/db.service.js';

@Module({
    providers: [
        {
            provide: 'DATABASE',
            useFactory: () => {
                return new Database('db.sqlite');
            },
        },
        DbService,
    ],
    exports: [DbService],
})
export class DatabaseModule implements OnModuleInit {
    constructor(private readonly dbService: DbService) {}

    async onModuleInit() {
        //create table
        await this.dbService.createTableIfNotExists();
        //prune database
        await this.dbService.pruneDb();
    }
}
