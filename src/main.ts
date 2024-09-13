import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { ScraperService } from './services/scraper.service.js';

// import { EmailService } from './services/email.service.js';
// import { medicalJobs } from './utils/jobTitles.js';

// const noOfJobsToEmail = 90;
async function startScraper() {
    try {
        const app = await NestFactory.createApplicationContext(AppModule);
        // const emailService = app.get(EmailService);
        // await emailService.sendEmailToEmployers(medicalJobs, noOfJobsToEmail);

        const scraperService = app.get(ScraperService);
        await scraperService.scrapeJobSearchResultPage(process.env.LMIA_APPROVED_EMPLOYER_PAGE);

        await app.close();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

await startScraper();
