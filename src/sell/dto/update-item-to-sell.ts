import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateItemToSellDto {
  @ApiProperty({
    example: 50,
    description: 'quantity of the item',
  })
  @IsNumber({}, { message: 'بڕی کاڵا دەبێت ژمارە بێت' })
  @IsPositive({ message: 'بڕی کاڵا دەبێت ژمارەیەکی ئەرێنی بێت' })
  @IsNotEmpty({ message: 'بڕی کاڵا پێویستە' })
  quantity: number;
}
