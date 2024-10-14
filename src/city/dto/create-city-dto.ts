import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export default class CreateCityDto {
  @ApiProperty({
    description: 'The name of the city',
    example: 'New York',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'ناوی شار دەبێت نووسین بێت' })
  @IsNotEmpty({ message: 'ناوی شار پێویستە' })
  @Length(2, 50, { message: 'ناوی شار دەبێت لە نێوان ٢ بۆ ٥٠ پیت بێت' })
  name: string;
}
