// src/app.module.ts
import { Module } from '@nestjs/common';
import { chromium } from 'playwright';

import { AppController } from './app.controller.js';
import { CsvService } from './csv-writer/csv-writer.service.js';
import { ScraperService } from './scraper/scraper.service.js';

@Module({
    imports: [],
    controllers: [AppController],
    providers: [
        ScraperService,
        CsvService,
        {
            provide: 'BROWSER',
            useFactory: async () => {
                return await chromium.launch();
            },
        },
    ],
    exports: ['BROWSER'],
})
export class AppModule {}
