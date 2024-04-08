// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ScraperService } from './scraper/scraper.service';

@Controller()
export class AppController {
    constructor(private readonly scraperService: ScraperService) {}

    @Get('/')
    async scrapeJobBank() {
        await this.scraperService.scrapeJobBank('psw', 'ontario');
        return { message: 'done' };
    }
}
