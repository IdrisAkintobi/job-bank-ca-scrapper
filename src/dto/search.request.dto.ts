import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class SearchRequestDto {
    @ApiProperty({
        description:
            'Title of the job to query on Job bank. If not passed, all jobs will be queried',
        example: 'Public Support Worker',
        required: false,
    })
    @IsString()
    readonly jobTitle: string;

    @ApiProperty({
        description:
            'Location of the job to query on Job bank. If not passed, all locations will be queried',
        example: 'Ontario',
        required: false,
    })
    @IsString()
    readonly jobLocation: string;

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
