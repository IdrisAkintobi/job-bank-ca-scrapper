import inquirer from 'inquirer';

export const searchQueryHandler = async (): Promise<{ jobTitle: string; jobLocation: string }> => {
    const credentials = await inquirer.prompt([
        {
            type: 'input',
            name: 'jobTitle',
            message: 'Enter job title:',
        },
        {
            type: 'input',
            name: 'jobLocation',
            message: 'Enter job location:',
        },
    ]);

    return { ...credentials };
};
