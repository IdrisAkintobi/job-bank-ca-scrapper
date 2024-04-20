import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { chromium } from 'playwright';

import { configValidationSchema } from './config/config.schema.js';
import { DatabaseModule } from './db/db.module.js';
import { CsvService } from './services/csv-writer.service.js';
import { EmailService } from './services/email.service.js';
import { ScraperService } from './services/scraper.service.js';

@Module({
    imports: [
        DatabaseModule,
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: configValidationSchema,
        }),
    ],
    providers: [
        ScraperService,
        CsvService,
        EmailService,
        {
            provide: 'BROWSER',
            useFactory: async () => {
                return await chromium.launch();
            },
        },
    ],
})
export class AppModule {}
