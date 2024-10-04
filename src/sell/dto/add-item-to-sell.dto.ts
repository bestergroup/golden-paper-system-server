import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

enum SellType {
  DEPT = 'قەرز',
  PAY = 'نەقد',
}
enum AddWay {
  CARTOON = 'cartoon',
  SINGLE = 'single',
}
enum WhichPrice {
  PLURAL_SELL = 'item_plural_sell_price',
  SINGLE_SELL = 'item_single_sell_price',
  PLURAL_JUMLA = 'item_plural_jumla_price',
  SINGLE_JUMLA = 'item_single_jumla_price',
}

export class AddItemToSellDto {
  @ApiProperty({
    example: 1,
    description: 'The Id of the item',
  })
  @IsNumber({}, { message: 'ناسنامەی بڕگە دەبێت ژمارە بێت' })
  @IsNotEmpty({ message: 'ناسنامەی بڕگە پێویستە' })
  item_id: number;

  @ApiProperty({
    example: true,
    description: 'Whether to use barcode',
  })
  @IsBoolean({ message: 'بارکۆد دەبێت بەڵێ/نەخێر بێت' })
  @IsNotEmpty({ message: 'بارکۆد پێویستە' })
  barcode: boolean;

  @ApiProperty({
    enum: WhichPrice,
    example: 'item_plural_sell_price',
    description: 'Which price to use',
  })
  @IsEnum(WhichPrice, { message: 'نرخ دەبێت یەکێک لە نرخە دیاریکراوەکان بێت' })
  @IsNotEmpty({ message: 'نرخ پێویستە' })
  whichPrice: WhichPrice;

  @ApiProperty({
    enum: AddWay,
    example: 'item_plural_sell_price',
    description: 'Which price to use',
  })
  @IsEnum(AddWay, { message: 'نرخ دەبێت یەکێک لە نرخە دیاریکراوەکان بێت' })
  @IsNotEmpty({ message: 'نرخ پێویستە' })
  addWay: AddWay;

  @ApiProperty({
    enum: SellType,
    example: 'item_plural_sell_price',
    description: 'Which price to use',
  })
  @IsEnum(SellType, { message: 'نرخ دەبێت یەکێک لە نرخە دیاریکراوەکان بێت' })
  @IsNotEmpty({ message: 'نرخ پێویستە' })
  sellType: SellType;

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
}
