import inquirer from 'inquirer';

export const searchPagesHandler = async (): Promise<{ noOfPages: number }> => {
    return await inquirer.prompt([
        {
            type: 'input',
            name: 'noOfPages',
            message: 'Enter the number of search result pages to scrape:',
            validate: (input: string) => {
                if (isNaN(Number(input))) {
                    return 'Please enter a valid number';
                }

                return true;
            },
            filter: (input: string) => Number(input),
        },
    ]);
};
