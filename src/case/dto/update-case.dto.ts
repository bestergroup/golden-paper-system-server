import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Id } from 'src/types/global';

export default class UpdateCaseDto {
  @ApiProperty({
    example: 100,
    description: 'The price of the expense',
  })
  @IsNumber({}, { message: 'نرخ دەبێت ژمارە بێت' })
  @IsPositive({ message: 'نرخ دەبێت ژمارەیەکی ئەرێنی بێت' })
  @IsNotEmpty({ message: 'نرخ پێویستە' })
  amount: Id;
}
