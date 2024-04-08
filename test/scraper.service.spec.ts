import { Test, TestingModule } from '@nestjs/testing';
import { ScraperService } from '../src/scraper/scraper.service';

describe.skip('ScraperService', () => {
    let service: ScraperService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ScraperService],
        }).compile();

        service = module.get<ScraperService>(ScraperService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
