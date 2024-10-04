import { IsEnum, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
enum SellType {
  DEPT = 'قەرز',
  PAY = 'نەقد',
}
export class UpdateSellDto {
  @ApiProperty({
    example: 100,
    description: 'The discount of the sell',
  })
  @IsNumber({}, { message: ' discount must be a number' })
  @IsPositive({ message: ' discount must be positive' })
  @IsNotEmpty({ message: ' discount is required' })
  discount: number;

  @ApiProperty({
    example: 1,
    description: 'The Id of the mandub',
  })
  @IsNumber({}, { message: 'ناسنامەی مەندوب دەبێت ژمارە بێت' })
  @IsNotEmpty({ message: 'ناسنامەی مەندوب پێویستە' })
  mandub_id: number;

  @ApiProperty({
    example: 1,
    description: 'The Id of the customer',
  })
  @IsNumber({}, { message: 'ناسنامەی کڕیار دەبێت ژمارە بێت' })
  @IsNotEmpty({ message: 'ناسنامەی کڕیار پێویستە' })
  customer_id: number;

  @ApiProperty({
    enum: SellType,
    example: 'item_plural_sell_price',
    description: 'Which price to use',
  })
  @IsEnum(SellType, { message: 'نرخ دەبێت یەکێک لە نرخە دیاریکراوەکان بێت' })
  @IsNotEmpty({ message: 'نرخ پێویستە' })
  sellType: SellType;
}
