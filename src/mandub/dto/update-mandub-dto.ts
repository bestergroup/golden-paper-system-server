import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  Matches,
  IsInt,
} from 'class-validator';
import { Id } from 'src/types/global';

export default class UpdateMandubDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'The full street of the user',
  })
  @IsString({ message: 'ناو دەبێت ڕشتە بێت' })
  @IsOptional()
  street: string;
  @ApiProperty({
    example: 'John',
    description: 'The first name of the employee',
  })
  @IsString({ message: 'ناوی یەکەم دەبێت ڕشتە بێت' })
  @IsNotEmpty({ message: 'ناوی یەکەم پێویستە' })
  first_name: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the employee',
  })
  @IsString({ message: 'ناوی دووەم دەبێت ڕشتە بێت' })
  @IsNotEmpty({ message: 'ناوی دووەم پێویستە' })
  last_name: string;

  @ApiProperty({ example: '1', description: 'The role ID of the user' })
  @IsNotEmpty({ message: 'ئایدی شار پێویستە' })
  @IsInt({ message: 'ئایدی شار دەبێت ژمارەیەکی تەواو بێت' })
  city_id: Id;

  @ApiProperty({
    example: '1234567890',
    description: 'The phone number of the user',
  })
  @IsString({ message: 'ژمارە تەلەفۆن دەبێت ڕشتە بێت' })
  @IsNotEmpty({ message: 'ژمارە تەلەفۆن پێویستە' })
  phone: string;
  @ApiProperty({
    example: '1234567890',
    description: 'The phone1 number of the user',
  })
  @IsString({ message: 'ژمارە تەلەفۆن دەبێت ڕشتە بێت' })
  @IsNotEmpty({ message: 'ژمارە تەلەفۆن پێویستە' })
  phone1: string;
  @ApiProperty({
    example: false,
    description: 'Indicates whether the employee is deleted or not',
  })
  @IsBoolean({ message: 'سڕینەوە دەبێت بەڵێ/نەخێر بێت' })
  @IsOptional()
  deleted?: boolean;
}
