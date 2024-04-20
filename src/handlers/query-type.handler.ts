import inquirer from 'inquirer';

import { JobQueryTypeEnum } from '../domain/enum/job-query.enum.js';

export const queryTypeHandler = async (): Promise<{ selectedQueryType: JobQueryTypeEnum }> => {
    const { userConsent } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'userConsent',
            message: 'Would you like to scrape Job bank CA or send email to employers?',
            default: true,
        },
    ]);

    if (!userConsent) {
        console.log('Bye 👋... Thank you for using our app');
        process.exit(0);
    }

    return await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedQueryType',
            message: 'Select the kind of jobs to query or send email',
            choices: Object.values(JobQueryTypeEnum),
        },
    ]);
};
