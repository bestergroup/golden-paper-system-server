import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export default class UpdateCityDto {
  @ApiProperty({
    description: 'The name of the city',
    example: 'New York',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'City name must be a valid string' })
  @IsNotEmpty({ message: 'City name is required' })
  @Length(2, 50, { message: 'City name must be between 2 and 50 characters' })
  name: string;
}
