import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { spawnSync } from 'node:child_process';
import { AppModule } from './app.module.js';
import { JobQueryTypeEnum } from './domain/enum/job-query.enum.js';
import { emailJobTitlesHandler } from './handlers/email-job-titles.handler.js';
import { queryTypeHandler } from './handlers/query-type.handler.js';
import { searchPagesHandler } from './handlers/search-pages.handler.js';
import { searchQueryHandler } from './handlers/search-query.handler.js';
import { EmailService } from './services/email.service.js';
import { ScraperService } from './services/scraper.service.js';

async function startScraper() {
    try {
        // Ensure playwright is installed before running the script
        const result = spawnSync('npx', ['playwright', 'install'], { stdio: 'inherit' });
        if (result.error || result.status !== 0) {
            console.error('Failed to run "npx playwright install"');
            process.exit(1);
        }

        const app = await NestFactory.createApplicationContext(AppModule);
        const scraperService = app.get(ScraperService);
        const configService = app.get(ConfigService);
        const emailService = app.get(EmailService);

        const LMIAApprovedEmployerPage = configService.get('LMIA_APPROVED_EMPLOYER_PAGE');
        const LMIAPendingEmployerPage = configService.get('LMIA_PENDING_EMPLOYER_PAGE');

        const { selectedQueryType } = await queryTypeHandler();

        switch (selectedQueryType) {
            case JobQueryTypeEnum.LMIA_APPROVED:
                const { noOfPages: approvedPages } = await searchPagesHandler();
                await scraperService.scrapeJobSearchResultPage(
                    LMIAApprovedEmployerPage,
                    approvedPages,
                );
                break;
            case JobQueryTypeEnum.LMIA_PENDING:
                const { noOfPages: pendingPages } = await searchPagesHandler();
                await scraperService.scrapeJobSearchResultPage(
                    LMIAPendingEmployerPage,
                    pendingPages,
                );
                break;
            case JobQueryTypeEnum.ALL_JOBS:
                const { jobTitle, jobLocation } = await searchQueryHandler();
                const { noOfPages } = await searchPagesHandler();
                await scraperService.scrapeJobBank(jobTitle, jobLocation, noOfPages);
                break;
            case JobQueryTypeEnum.SEND_EMAIL:
                const { jobTitlesArray, noOfJobsToEmail } = await emailJobTitlesHandler();
                await emailService.sendEmailToEmployers(jobTitlesArray, noOfJobsToEmail);
                break;
        }

        await app.close();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

await startScraper();
