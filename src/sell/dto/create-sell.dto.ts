import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
} from 'class-validator';
enum SellType {
  DEPT = 'قەرز',
  PAY = 'نەقد',
}
export class CreateSellDto {
  @ApiProperty({
    example: 1,
    description: 'The Id of the mandub',
  })
  @IsNumber({}, { message: 'ناسنامەی مەندوب دەبێت ژمارە بێت' })
  @IsNotEmpty({ message: 'ناسنامەی مەندوب پێویستە' })
  mandubId: number;

  @ApiProperty({
    example: 1,
    description: 'The Id of the customer',
  })
  @IsNumber({}, { message: 'ناسنامەی کڕیار دەبێت ژمارە بێت' })
  @IsNotEmpty({ message: 'ناسنامەی کڕیار پێویستە' })
  customerId: number;

  @ApiProperty({
    enum: SellType,
    example: 'item_plural_sell_price',
    description: 'Which price to use',
  })
  @IsEnum(SellType, { message: 'نرخ دەبێت یەکێک لە نرخە دیاریکراوەکان بێت' })
  @IsNotEmpty({ message: 'نرخ پێویستە' })
  sellType: SellType;
}
