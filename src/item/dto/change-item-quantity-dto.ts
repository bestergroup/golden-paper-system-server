import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeItemQuantityDto {
  @ApiProperty({
    example: 100,
    description: 'The quantity of the item in stock',
  })
  @IsNumber({}, { message: 'بڕ دەبێت ژمارە بێت' })
  @IsPositive({ message: 'بڕ دەبێت ژمارەیەکی ئەرێنی بێت' })
  @IsNotEmpty({ message: 'بڕ پێویستە' })
  @IsOptional()
  quantity: number;
}
