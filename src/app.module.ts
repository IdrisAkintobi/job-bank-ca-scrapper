// src/app.module.ts
import { Module } from '@nestjs/common';
import { chromium } from 'playwright';
import { AppController } from './app.controller';
import { CsvService } from './csv-writer/csv-writer.service';
import { ScraperService } from './scraper/scraper.service';

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
