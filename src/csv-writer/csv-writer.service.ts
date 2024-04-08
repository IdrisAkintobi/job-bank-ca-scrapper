import { Injectable } from '@nestjs/common';
import { createObjectCsvWriter } from 'csv-writer';
// import path from 'node:path';
import { JobSearchResult } from '../domain/interface.job-search-result';

@Injectable()
export class CsvService {
    async writeCsv(
        data: Record<string, Omit<JobSearchResult, 'jobTitle'>[]>,
        fileName: string,
        internal = true,
    ) {
        const csvWriter = createObjectCsvWriter({
            path: `${fileName}.csv`,
            header: [
                { id: 'jobTitle', title: 'Job Title' },
                { id: 'business', title: 'Business' },
                ...(internal && [{ id: 'email', title: 'Email' }]),
                { id: 'location', title: 'Location' },
                { id: 'salary', title: 'Salary' },
                { id: 'date', title: 'Date' },
                ...(internal && [{ id: 'expiry', title: 'expiry' }]),
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
