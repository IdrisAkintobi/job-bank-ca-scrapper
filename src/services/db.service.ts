import { Inject, Injectable } from '@nestjs/common';
import { Database } from 'better-sqlite3';
import { JobSearchResult } from '../domain/interface.job-search-result';

@Injectable()
export class DbService {
    constructor(@Inject('DATABASE') private readonly db: Database) {}

    async createTableIfNotExists() {
        this.db
            .prepare(
                `
            CREATE TABLE IF NOT EXISTS jobs (
                jobTitle TEXT,
                href TEXT,
                business TEXT,
                location TEXT,
                salary TEXT,
                date TEXT,
                email TEXT,
                expiry TEXT,
                emailSent INTEGER,
                PRIMARY KEY (jobTitle, business, location, email)
            )
        `,
            )
            .run();
    }

    async saveJobSearchResults(results: JobSearchResult[]) {
        const insert = this.db.prepare(`
            INSERT OR IGNORE INTO jobs (jobTitle, href, business, location, salary, date, email, expiry, emailSent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        this.db.transaction(() => {
            for (const result of results) {
                try {
                    insert.run(
                        result.jobTitle,
                        result.href,
                        result.business,
                        result.location,
                        result.salary,
                        result.date,
                        result.email,
                        result.expiry,
                        result.emailSent ? 1 : 0,
                    );
                } catch (error) {
                    console.error('Error inserting record:', error.message);
                }
            }
        })();
    }

    async getUnsentJobSearchResults(limit: number = 100) {
        return this.db
            .prepare('SELECT * FROM jobs WHERE emailSent = 0 ORDER BY date DESC LIMIT ?')
            .all(limit) as JobSearchResult[];
    }

    async getUnsentJobSearchResultsWithTitles(titles: string[], limit: number = 100) {
        if (!titles.length) return this.getUnsentJobSearchResults(limit);

        return this.db
            .prepare(
                'SELECT * FROM jobs WHERE emailSent = 0 AND jobTitle IN (' +
                    titles.map(() => '?').join(',') +
                    ') ORDER BY date DESC LIMIT ?',
            )
            .all([...titles, limit]) as JobSearchResult[];
    }

    async markAsSent(job: Pick<JobSearchResult, 'href' | 'email' | 'business'>) {
        this.db
            .prepare('UPDATE jobs SET emailSent = 1 WHERE href = ? AND email = ? AND business = ?')
            .run(job.href, job.email, job.business);
    }

    async jobExists(jobId: string): Promise<boolean> {
        const result = await this.db
            .prepare('SELECT 1 FROM jobs WHERE href LIKE ?')
            .get(`%/${jobId}%`);
        return !!result;
    }
}
