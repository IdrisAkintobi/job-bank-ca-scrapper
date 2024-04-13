// job-search.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Database } from 'better-sqlite3';
import { JobSearchResult } from '../domain/interface.job-search-result';

@Injectable()
export class DbService {
    constructor(@Inject('DATABASE') private readonly db: Database) {
        this.createTableIfNotExists();
    }

    private createTableIfNotExists() {
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

    saveJobSearchResults(results: JobSearchResult[]) {
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

    getUnsentJobSearchResults(limit: number = 100) {
        return this.db
            .prepare('SELECT * FROM jobs WHERE emailSent = 0 LIMIT ?')
            .all(limit) as JobSearchResult[];
    }

    updateEmailSent(href: string, email: string, business: string, emailSent: boolean) {
        this.db
            .prepare('UPDATE jobs SET emailSent = ? WHERE href = ? AND email = ? AND business = ?')
            .run(emailSent ? 1 : 0, href, email, business);
    }
}
