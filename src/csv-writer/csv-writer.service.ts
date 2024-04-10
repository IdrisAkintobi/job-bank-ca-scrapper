import { Injectable } from '@nestjs/common';
import { createObjectCsvWriter } from 'csv-writer';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { JobSearchResult } from '../domain/interface.job-search-result.js';

@Injectable()
export class CsvService {
    private readonly rootResultsFolderPath = join(process.cwd(), 'results');
    constructor() {
        if (!existsSync(this.rootResultsFolderPath)) {
            mkdirSync(this.rootResultsFolderPath);
        }
    }
    async writeCsv(
        data: Record<string, Omit<JobSearchResult, 'jobTitle'>[]>,
        fileName: string,
        internal = true,
    ) {
        const csvWriter = createObjectCsvWriter({
            path: join(this.rootResultsFolderPath, `${fileName}.csv`),
            header: [
                { id: 'jobTitle', title: 'Job Title' },
                { id: 'business', title: 'Business' },
                ...(internal ? [{ id: 'email', title: 'Email' }] : []),
                { id: 'location', title: 'Location' },
                { id: 'salary', title: 'Salary' },
                { id: 'date', title: 'Date' },
                { id: 'expiry', title: 'expiry' },
                { id: 'href', title: 'Link' },
            ],
        });

        // Flatten the object and write to CSV
        const records = [];
        for (const [jobTitle, jobDetails] of Object.entries(data)) {
            for (let i = 0; i < jobDetails.length; i++) {
                records.push({
                    jobTitle: i === 0 ? jobTitle : '',
                    ...jobDetails[i],
                });
            }
        }

        await csvWriter.writeRecords(records);
    }
}
