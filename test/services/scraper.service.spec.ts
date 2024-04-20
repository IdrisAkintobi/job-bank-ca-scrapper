import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { CsvService } from '../../src/services/csv-writer.service.js';
import { DbService } from '../../src/services/db.service.js';
import { ScraperService } from '../../src/services/scraper.service.js';

describe('ScraperService', () => {
    let service: ScraperService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ScraperService,
                {
                    provide: 'BROWSER',
                    useValue: jest.fn(),
                },
                {
                    provide: CsvService,
                    useValue: jest.fn(),
                },
                {
                    provide: DbService,
                    useValue: jest.fn(),
                },
                {
                    provide: ConfigService,
                    useValue: {},
                },
            ],
        }).compile();

        service = module.get<ScraperService>(ScraperService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should have all methods defined', () => {
        expect(service.scrapeJobBank).toBeDefined();
        expect(service.scrapeJobSearchResultPage).toBeDefined();
    });
});
