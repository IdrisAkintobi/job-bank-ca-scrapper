import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CheerioAPI, load } from 'cheerio';
import { Browser, Page } from 'playwright';

import { CsvService } from '../csv-writer/csv-writer.service.js';
import { DbService } from '../db/db.service.js';
import { JobSearchResult } from '../domain/interface.job-search-result.js';
import { Utils } from '../utils/utils.js';

@Injectable()
export class ScraperService {
    private timeout = 30000;

    private internalJobsResult: Record<string, Omit<JobSearchResult, 'jobTitle'>[]> = {};
    private externalJobsResult: Record<string, Omit<JobSearchResult, 'jobTitle'>[]> = {};

    constructor(
        @Inject('BROWSER') private readonly browser: Browser,
        @Inject(CsvService) private readonly csvService: CsvService,
        @Inject(DbService) private readonly dbService: DbService,
        private readonly configService: ConfigService,
    ) {}

    async scrapeJobBank(title: string, location: string, noOfResultPages = 2) {
        const baseUrl = this.configService.get('BASE_URL');
        const page = await this.browser.newPage();
        page.setDefaultTimeout(this.timeout);
        await page.goto(baseUrl);
        await this.clearPopUp(page);

        const jobTitle = page.getByPlaceholder('Example: Cook');
        await jobTitle.fill(title || '');

        const jobLocation = page.getByPlaceholder('Location');
        await jobLocation.fill(location || '');

        await page.locator('#searchButton').click({ force: true });

        await page.locator('#results-list-content').waitFor({ state: 'visible' });

        await this.loadMoreResult(page, noOfResultPages);

        const jobSearchResult = await this.getJobSearchResult(page);

        await this.processResult(page, jobSearchResult, '-search');
        await page.close();
    }

    async scrapeJobSearchResultPage(url: string, noOfResultPages = 2) {
        const page = await this.browser.newPage();
        page.setDefaultTimeout(this.timeout);
        await page.goto(url);
        await this.clearPopUp(page);

        await page.locator('#results-list-content').waitFor({ state: 'visible' });

        await this.loadMoreResult(page, noOfResultPages - 1);

        const jobSearchResult = await this.getJobSearchResult(page);

        await this.processResult(page, jobSearchResult, '-page');
        await page.close();
    }

    private async getJobDetails(page: Page, jobSearchResult: JobSearchResult) {
        //set default timeout
        page.setDefaultTimeout(this.timeout);
        await page.goto(jobSearchResult.href);

        await this.clearPopUp(page);

        const externalJob = await page.$('#externalJobLink');
        const internalJob = await page.$('#applynowbutton');

        const { jobTitle, ...rest } = jobSearchResult;
        let $: CheerioAPI;
        if (internalJob) {
            await internalJob.click({ force: true });
            const applicationDetails = page.locator('#howtoapply');
            await applicationDetails.waitFor({ state: 'visible' });
            $ = load(await page.content());
            const email = $('#howtoapply a[href^="mailto:"]').text().trim();
            const expiry = $('p[property="validThrough"]').text().trim();
            // Check if the email element exists
            if (email) {
                this.internalJobsResult[jobTitle] = this.internalJobsResult[jobTitle] || [];
                this.internalJobsResult[jobTitle].push({ email, expiry, ...rest });
            }
        } else if (externalJob) {
            $ = load(await page.content());
            const expiry = $('p[property="validThrough"]').text().trim();
            this.externalJobsResult[jobTitle] = this.externalJobsResult[jobTitle] || [];
            this.externalJobsResult[jobTitle].push({ expiry, ...rest });
        }
    }

    private async getJobSearchResult(page: Page): Promise<Array<JobSearchResult>> {
        const resultList = page.locator('#results-list-content');
        await resultList.waitFor({ state: 'visible' });

        const searchResultHTML = await resultList.innerHTML();
        const $ = load(searchResultHTML);
        const jobList = $('article');
        if (!jobList.length) return [];
        const jobDetails = [];
        jobList.each((_, element) => {
            const anchorTag = $(element).find('a.resultJobItem');
            const href = 'https://www.jobbank.gc.ca' + anchorTag.attr('href');
            const jobTitle = anchorTag.find('span.noctitle').contents().first().text().trim();
            const business = $(element).find('li.business').text().trim();
            const location = $(element)
                .find('li.location')
                .text()
                .trim()
                .replace(/\s+/g, ' ')
                .replace('Location ', '');
            const salary = $(element)
                .find('li.salary')
                .text()
                .trim()
                .replace(/\s+/g, ' ')
                .replace('Salary: ', '');
            const date = $(element).find('li.date').text().trim();

            jobDetails.push({
                jobTitle,
                href,
                business,
                location,
                salary,
                date: new Date(date).toISOString().split('T')[0],
            });
        });
        console.log('All pages loaded');
        return jobDetails;
    }

    private async clearPopUp(page: Page) {
        //check if modal with the id outOfCountry-popup is visible, if so, remove popup element
        const popup = await page.$('#outOfCountry-popup');
        if (!popup) return;
        await Promise.all([
            // Remove the div with classes mfp-bg mfp-ready
            page.evaluate(() => {
                const bgElement = document.querySelector('div.mfp-bg.mfp-ready');
                if (bgElement) {
                    bgElement.remove();
                }
            }),

            // Remove the div with classes mfp-wrap mfp-auto-cursor mfp-ready
            page.evaluate(() => {
                const wrapElement = document.querySelector(
                    'div.mfp-wrap.mfp-auto-cursor.mfp-ready',
                );
                if (wrapElement) {
                    wrapElement.remove();
                }
            }),
        ]);
    }

    private async loadMoreResult(page: Page, noOfResultPages: number) {
        let moreResults = await page.$('#moreresultbutton');
        let currentPage = 0;

        while (moreResults && currentPage < noOfResultPages) {
            try {
                await moreResults.click({ force: true });
                await page.waitForTimeout(this.timeout / 5);
                moreResults = await page.$('#moreresultbutton');
                currentPage++;
            } catch (error) {
                break;
            }
        }
    }

    private async processResult(
        page: Page,
        jobSearchResult: JobSearchResult[],
        filePostfix?: string,
    ) {
        console.log('getting job details');
        Utils.processBar.start(jobSearchResult.length, 0);
        const failedToGetJobDetail = [];
        for (const job of jobSearchResult) {
            try {
                await this.getJobDetails(page, job);
            } catch (error) {
                failedToGetJobDetail.push(job);
                console.log(`failed to get details of ${failedToGetJobDetail.length} jobs`);
            } finally {
                Utils.processBar.increment();
            }
        }

        Utils.processBar.stop();

        const cleanedInternalJobs = await Utils.cleanData(this.internalJobsResult);
        const cleanedExternalJobs = await Utils.cleanData(this.externalJobsResult);

        // Write to CSV
        console.log('writing to csv 📄');
        await this.csvService.writeCsv(cleanedInternalJobs, `internal-result${filePostfix}`);
        await this.csvService.writeCsv(cleanedExternalJobs, `external-result${filePostfix}`, false);

        // Write to DB
        console.log('writing to db 💾');
        this.dbService.saveJobSearchResults(cleanedInternalJobs);
        if (failedToGetJobDetail.length)
            console.log('job details request failed', failedToGetJobDetail);
        console.log('job details processed successfully');
        return;
    }

    async onModuleDestroy() {
        await this.browser.close();
    }
}
