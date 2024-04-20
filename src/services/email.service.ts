import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import { join } from 'path';

import { Utils } from '../utils/utils.js';
import { DbService } from './db.service.js';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    private sleepTime = 3000;

    constructor(
        private readonly configService: ConfigService,
        private readonly dbService: DbService,
    ) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('EMAIL_HOST'),
            port: this.configService.get<number>('EMAIL_PORT'),
            secure: this.configService.get<boolean>('EMAIL_SECURE'),
            auth: {
                user: this.configService.get('EMAIL_USER'),
                pass: this.configService.get('EMAIL_PASSWORD'),
            },
        });
    }

    private async sendEmail(
        to: string,
        subject: string,
        templatePath: string,
        data: Record<string, any>,
    ): Promise<void> {
        const template = readFileSync(templatePath, 'utf8');
        const compiledTemplate = handlebars.compile(template);
        const html = compiledTemplate(data);

        const senderEmail = this.configService.get('EMAIL_USER');
        const senderName = this.configService.get('SENDER_NAME');

        await this.transporter.sendMail({
            from: `${senderName} <${senderEmail}>`,
            to,
            subject,
            html,
        });
    }

    public async sendEmailToEmployers(jobTitlesArray: string[], noOfJobsToEmail = 50) {
        const templatePath = join(process.cwd(), 'email-template', 'general-email.html');
        const jobs = await this.dbService.getUnsentJobSearchResultsWithTitles(
            jobTitlesArray,
            noOfJobsToEmail,
        );
        console.log(`Found ${jobs.length} jobs 🗄️`);

        if (!jobs.length) return;

        for (const job of jobs) {
            const location = Utils.convertLocation(job.location);
            const jobTitle = Utils.capitalizeJobTitle(job.jobTitle);
            try {
                await this.sendEmail(
                    job.email,
                    `Application for the position of ${jobTitle}`,
                    templatePath,
                    { jobTitle, location },
                );
                await this.dbService.markAsSent(job);
                console.log(`Email successfully dispatched to ${job.email} ✉️✉️`);
                await Utils.sleep(this.sleepTime);
            } catch (error) {
                console.log(error);
            }
        }
        console.log('All emails dispatched 📬');
        return;
    }
}
