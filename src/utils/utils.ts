import { Presets, SingleBar } from 'cli-progress';

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
}
