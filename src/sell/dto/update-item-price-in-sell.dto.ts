import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateItemPriceInSellDto {
  @ApiProperty({
    example: 100,
    description: 'The selling price of the item in plural',
  })
  @IsNumber({}, { message: 'نرخی فرۆشتنی کۆ دەبێت ژمارە بێت' })
  @IsOptional()
  item_sell_price: number;
}
