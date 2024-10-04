import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsDateString,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class UpdateExpenseDto {
  @ApiProperty({
    example: 100,
    description: 'The price of the expense',
  })
  @IsNumber({}, { message: 'نرخ دەبێت ژمارە بێت' })
  @IsPositive({ message: 'نرخ دەبێت ژمارەیەکی ئەرێنی بێت' })
  @IsNotEmpty({ message: 'نرخ پێویستە' })
  price: number;

  @ApiProperty({
    example: 'Office supplies purchase',
    description: 'The title of the expense',
  })
  @IsString({ message: 'ناونیشان دەبێت ڕشتە بێت' })
  @IsNotEmpty({ message: 'ناونیشان پێویستە' })
  title: string;

  @ApiProperty({
    example: 'Additional notes about the expense',
    description: 'Additional notes about the expense',
    required: false,
  })
  @IsString({ message: 'تێبینی دەبێت ڕشتە بێت' })
  @IsOptional()
  note?: string;

  @ApiProperty({
    example: false,
    description: 'Indicates whether the expense is from a case',
  })
  @IsBoolean({ message: 'لە کەیسەوە دەبێت بەڵێ/نەخێر بێت' })
  @IsNotEmpty({ message: 'لە کەیسەوە پێویستە' })
  fromCase: boolean;

  @ApiProperty({
    example: 'John Doe',
    description: 'The person who made the expense',
  })
  @IsString({ message: 'خەرجکەر دەبێت ڕشتە بێت' })
  @IsNotEmpty({ message: 'خەرجکەر پێویستە' })
  expense_by: string;
}
