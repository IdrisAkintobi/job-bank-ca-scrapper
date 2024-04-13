import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { JobQueryTypeEnum } from './domain/enum/job-query.enum.js';
import { queryTypeHandler } from './handlers/query-type.handler.js';
import { searchPagesHandler } from './handlers/search-pages.handler.js';
import { searchQueryHandler } from './handlers/search-query.handler.js';
import { ScraperService } from './scraper/scraper.service.js';

// Define CLI commands
async function startScraper() {
    try {
        const app = await NestFactory.createApplicationContext(AppModule);
        const scraperService = app.get(ScraperService);
        const configService = app.get(ConfigService);

        const LMIAApprovedEmployerPage = configService.get('LMIA_APPROVED_EMPLOYER_PAGE');
        const LMIAPendingEmployerPage = configService.get('LMIA_PENDING_EMPLOYER_PAGE');

        const { selectedQueryType } = await queryTypeHandler();
        const { noOfPages } = await searchPagesHandler();

        switch (selectedQueryType) {
            case JobQueryTypeEnum.LMIA_APPROVED:
                await scraperService.scrapeJobSearchResultPage(LMIAApprovedEmployerPage, noOfPages);
                break;
            case JobQueryTypeEnum.LMIA_PENDING:
                await scraperService.scrapeJobSearchResultPage(LMIAPendingEmployerPage, noOfPages);
                break;
            default:
                const { jobTitle, jobLocation } = await searchQueryHandler();
                await scraperService.scrapeJobBank(jobTitle, jobLocation, noOfPages);
                break;
        }
        app.close();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

startScraper();
