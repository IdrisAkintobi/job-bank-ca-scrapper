import inquirer from 'inquirer';

export const emailJobTitlesHandler = async (): Promise<{
    jobTitlesArray: string[];
    noOfJobsToEmail: number;
}> => {
    const emailJobData = await inquirer.prompt([
        {
            type: 'input',
            name: 'jobTitlesArray',
            message:
                'Enter the title of job(s) separated by comma(",") that you\'ll like to send emails:',
            filter: (input: string) => {
                return !!input.trim() ? input.split(',').map(item => item.trim()) : [];
            },
        },
        {
            type: 'input',
            name: 'noOfJobsToEmail',
            message: "Enter the number of jobs you'll like to send email to:",
        },
    ]);

    return emailJobData;
};
