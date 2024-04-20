import { Presets, SingleBar } from 'cli-progress';
import { URL } from 'node:url';

import { JobSearchResult } from '../domain/interface.job-search-result.js';

export class Utils {
    public static processBar = new SingleBar({}, Presets.shades_classic);

    public static async cleanData(
        data: Record<string, Omit<JobSearchResult, 'jobTitle'>[]>,
        internal = true,
    ): Promise<JobSearchResult[]> {
        // Flatten the object
        const records = [];
        for (const [jobTitle, jobDetails] of Object.entries(data)) {
            const uniqueJobDetails = internal
                ? await this.removeDuplicateEmail(jobDetails)
                : jobDetails;
            await this.sortJobDetailsByBusiness(jobDetails);
            for (const job of uniqueJobDetails) {
                records.push({
                    jobTitle,
                    ...job,
                });
            }
        }

        return records;
    }

    private static async sortJobDetailsByBusiness(data: Array<Omit<JobSearchResult, 'jobTitle'>>) {
        return data.sort((a, b) => a.business.localeCompare(b.business));
    }

    private static async removeDuplicateEmail(data: Array<Omit<JobSearchResult, 'jobTitle'>>) {
        return [
            ...new Map(
                data.map(item => [item.email || Math.random().toString().substring(2, 8), item]),
            ).values(),
        ];
    }

    public static convertLocation(location: string) {
        const provinceMap = {
            AB: 'Alberta',
            BC: 'British Columbia',
            MB: 'Manitoba',
            NB: 'New Brunswick',
            NL: 'Newfoundland and Labrador',
            NS: 'Nova Scotia',
            NT: 'Northwest Territories',
            NU: 'Nunavut',
            ON: 'Ontario',
            PE: 'Prince Edward Island',
            QC: 'Quebec',
            SK: 'Saskatchewan',
            YT: 'Yukon',
        };

        const match = location.match(/^(.+)\s\((\w{2})\)$/);
        if (!match) {
            return location;
        }

        const city = match[1];
        const provinceAbbr = match[2];

        const province = provinceMap[provinceAbbr];
        if (!province) {
            return location;
        }

        return `${city}, ${province}`;
    }

    public static capitalizeJobTitle(jobTitle: string): string {
        return jobTitle.replace(/\b\w/g, char => char.toUpperCase());
    }

    public static async sleep(ms: number): Promise<void> {
        console.log(`Sleeping for ${ms / 1000} seconds`);
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public static extractJobId(urlString: string): string | null {
        try {
            const url = new URL(urlString);
            const parts = url.pathname.split('/');
            const jobId = parts[parts.length - 1];
            return jobId.split(';')[0]; // Exclude any session data after the job ID
        } catch (error) {
            console.error('Invalid URL:', urlString);
            return null;
        }
    }
}
