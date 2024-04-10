import { NestFactory } from '@nestjs/core';
import { program } from 'commander';

import appData from '../package.json' with { type: 'json' };
import { AppModule } from './app.module.js';
import { JobQueryTypeEnum } from './domain/enum/job-query.enum.js';
import { queryTypeHandler } from './handlers/query-type.handler.js';
import { searchPagesHandler } from './handlers/search-pages.handler.js';
import { searchQueryHandler } from './handlers/search-query.handler.js';
import { ScraperService } from './scraper/scraper.service.js';

const LMIAApprovedEmployerPage =
    'https://www.jobbank.gc.ca/jobsearch/jobsearch?flg=E&page=1&sort=M&fsrc=32&fskl=101020';
const LMIAPendingEmployerPage =
    'https://www.jobbank.gc.ca/jobsearch/jobsearch?flg=E&page=1&sort=M&fsrc=32&fskl=101010';

// Define CLI commands
program
    .command('start')
    .description(appData.description)
    .version(appData.version)
    .action(async () => {
        try {
            const app = await NestFactory.createApplicationContext(AppModule);
            const scraperService = app.get(ScraperService);
            const { selectedQueryType } = await queryTypeHandler();
            const { noOfPages } = await searchPagesHandler();
            switch (selectedQueryType) {
                case JobQueryTypeEnum.LMIA_APPROVED:
                    await scraperService.scrapeJobSearchResultPage(
                        LMIAApprovedEmployerPage,
                        noOfPages,
                    );
                    break;
                case JobQueryTypeEnum.LMIA_PENDING:
                    await scraperService.scrapeJobSearchResultPage(
                        LMIAPendingEmployerPage,
                        noOfPages,
                    );
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
    });

program.parse(process.argv);
