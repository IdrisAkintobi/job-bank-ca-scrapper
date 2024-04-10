import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUrl, Min } from 'class-validator';

export class ScraperRequestDto {
    @ApiProperty({
        description: 'Job bank ca search result page to scrape',
        example:
            'https://www.jobbank.gc.ca/jobsearch/jobsearch?flg=E&page=1&sort=M&fsrc=32&fskl=101020',
        required: true,
    })
    @IsUrl({
        require_protocol: true,
        allow_underscores: true,
    })
    readonly pageUrl: string;

    @ApiProperty({
        description: 'Number of result pages to scrape',
        example: 2,
        required: false,
        default: 2,
    })
    @IsNumber({ allowNaN: false, allowInfinity: false })
    @Min(1)
    readonly noOfPages: number;
}
