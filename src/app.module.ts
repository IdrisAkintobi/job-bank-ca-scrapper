import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Database from 'better-sqlite3';
import { chromium } from 'playwright';

import { AppController } from './app.controller.js';
import { configValidationSchema } from './config/config.schema.js';
import { CsvService } from './csv-writer/csv-writer.service.js';
import { DbService } from './db/db.service.js';
import { ScraperService } from './scraper/scraper.service.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: configValidationSchema,
        }),
    ],
    controllers: [AppController],
    providers: [
        ScraperService,
        CsvService,
        DbService,
        {
            provide: 'BROWSER',
            useFactory: async () => {
                return await chromium.launch();
            },
        },
        {
            provide: 'DATABASE',
            useFactory: () => {
                return new Database('db.sqlite');
            },
        },
    ],
})
export class AppModule {}
