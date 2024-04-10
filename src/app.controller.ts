import { Body, Controller, Get } from '@nestjs/common';

import { ScraperRequestDto } from './dto/scraper.request.dto.js';
import { SearchRequestDto } from './dto/search.request.dto.js';
import { ScraperService } from './scraper/scraper.service.js';

@Controller()
export class AppController {
    constructor(private readonly scraperService: ScraperService) {}

    @Get('/')
    async scrapeJobBank(@Body() { jobTitle, jobLocation, noOfPages }: SearchRequestDto) {
        await this.scraperService.scrapeJobBank(jobTitle, jobLocation, noOfPages);
        return { message: 'done' };
    }

    @Get('/page')
    async scrapeLMIAApproved(@Body() { pageUrl, noOfPages }: ScraperRequestDto) {
        await this.scraperService.scrapeJobSearchResultPage(pageUrl, noOfPages);
        return { message: 'done' };
    }
}
