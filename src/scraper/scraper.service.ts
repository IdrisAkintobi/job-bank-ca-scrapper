// src/scraper/scraper.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { load } from 'cheerio';
import { Browser, Page } from 'playwright';

import { CsvService } from '../csv-writer/csv-writer.service';
import { JobSearchResult } from '../domain/interface.job-search-result';

const baseUrl = 'https://www.jobbank.gc.ca';
// const email: 'limlomaspi@gufum.com';
// const password: '1Limlomaspi@gufum.com';
// const url = https://www.jobbank.gc.ca/jobsearch/jobsearch?fsrc=32#results-list-content
const LMIAApprovedEmployer =
    'https://www.jobbank.gc.ca/jobsearch/jobsearch?flg=E&page=1&sort=M&fsrc=32&fskl=101020';
const LMIAPendingEmployer =
    'https://www.jobbank.gc.ca/jobsearch/jobsearch?flg=E&page=1&sort=M&fsrc=32&fskl=101010';

@Injectable()
export class ScraperService {
    private timeout = 15000;

    private internalJobsResult: Record<string, Omit<JobSearchResult, 'jobTitle'>[]> = {};
    private externalJobsResult: Record<string, Omit<JobSearchResult, 'jobTitle'>[]> = {};

    constructor(
        @Inject('BROWSER') private readonly browser: Browser,
        @Inject(CsvService) private readonly csvService: CsvService,
    ) {}

    async scrapeJobBank(title: string, location: string, noOfResultPages = 2) {
        const page = await this.browser.newPage();
        page.setDefaultTimeout(this.timeout);

        await page.goto(baseUrl);
        await this.clearPopUp(page);

        const jobTitle = page.getByPlaceholder('Example: Cook');
        await jobTitle.fill(title);

        const jobLocation = page.getByPlaceholder('Location');
        await jobLocation.fill(location);

        await page.locator('#searchButton').click({ force: true });

        await page.locator('#results-list-content').waitFor({ state: 'visible' });

        await this.loadMoreResult(page, noOfResultPages);

        const jobSearchResult = await this.getJobSearchResult(page);

        await page.close();
        console.log('length', jobSearchResult.length);
        console.log('getting job details');
        await this.processResult(jobSearchResult, '-search');
    }

    async scrapeLMIAJobs(approved = true, noOfResultPages = 2) {
        const page = await this.browser.newPage();
        page.setDefaultTimeout(this.timeout);

        const url = approved ? LMIAApprovedEmployer : LMIAPendingEmployer;
        await page.goto(url);
        await this.clearPopUp(page);

        await page.locator('#results-list-content').waitFor({ state: 'visible' });

        await this.loadMoreResult(page, noOfResultPages);

        const jobSearchResult = await this.getJobSearchResult(page);

        await page.close();
        console.log('length', jobSearchResult.length);
        console.log('getting job details');
        const postfix = approved ? '-approved' : '-pending';
        await this.processResult(jobSearchResult, postfix);
    }

    private async getJobDetails(jobSearchResult: JobSearchResult) {
        const page = await this.browser.newPage();
        //set default timeout
        page.setDefaultTimeout(this.timeout);
        await page.goto(jobSearchResult.href);

        await this.clearPopUp(page);

        const externalJob = await page.$('#externalJobLink');
        const internalJob = await page.$('#applynowbutton');

        const { jobTitle, ...rest } = jobSearchResult;
        const $ = load(await page.content());
        const expiry = $('p[property="validThrough"]').text().trim();
        if (internalJob) {
            await internalJob.click({ force: true });
            const applicationDetails = page.locator('#howtoapply');
            await applicationDetails.waitFor({ state: 'visible', timeout: this.timeout * 2 });
            const email = $('#howtoapply a[href^="mailto:"]').text().trim();
            // Check if the email element exists
            if (email) {
                this.internalJobsResult[jobTitle] =
                    this.internalJobsResult[jobSearchResult.jobTitle] || [];
                this.internalJobsResult[jobTitle].push({ email, expiry, ...rest });
            }
        } else if (externalJob) {
            this.externalJobsResult[jobTitle] =
                this.externalJobsResult[jobSearchResult.jobTitle] || [];
            this.externalJobsResult[jobTitle].push({ expiry, ...rest });
        }

        await page.close();
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
        let currentPage = 1;

        while (moreResults && currentPage < noOfResultPages) {
            try {
                await moreResults.click({ force: true });
                await page.waitForTimeout(this.timeout / 4);
                moreResults = await page.$('#moreresultbutton');
                currentPage++;
            } catch (error) {
                break;
            }
        }
    }

    private async processResult(jobSearchResult: JobSearchResult[], filePostfix?: string) {
        const failedToGetJobDetail = [];
        for (const job of jobSearchResult) {
            try {
                await this.getJobDetails(job);
            } catch (error) {
                failedToGetJobDetail.push(job);
                console.log(`failed to get details of ${failedToGetJobDetail.length} jobs`);
            }
        }

        await this.csvService.writeCsv(this.internalJobsResult, `internal-result${filePostfix}`);
        await this.csvService.writeCsv(
            this.externalJobsResult,
            `external-result${filePostfix}`,
            false,
        );
        if (failedToGetJobDetail.length)
            console.log('job details request failed', failedToGetJobDetail);
        console.log('job details request successful');
        return;
    }

    async onModuleDestroy() {
        await this.browser.close();
    }
}
