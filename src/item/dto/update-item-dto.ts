import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateItemDto {
  @ApiProperty({
    example: 'Example Item',
    description: 'The name of the item',
  })
  @IsString({ message: 'ناو دەبێت ڕیزبەند بێت' })
  @IsNotEmpty({ message: 'ناو پێویستە' })
  name: string;

  @ApiProperty({
    example: '1234567890123',
    description: 'The barcode of the item',
  })
  @IsString({ message: 'بارکۆد دەبێت ڕیزبەند بێت' })
  @IsNotEmpty({ message: 'بارکۆد پێویستە' })
  barcode: string;

  @ApiProperty({
    example: 'example-image.jpg',
    description: 'The name of the item image',
    required: false,
  })
  @IsString({ message: 'ناوی وێنە دەبێت ڕیزبەند بێت' })
  @IsOptional()
  image_name?: string;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'The URL of the item image',
    required: false,
  })
  @IsString({ message: 'بەستەری وێنە دەبێت بەستەرێکی دروست بێت' })
  @IsOptional()
  image_url?: string;

  @ApiProperty({
    example: 50,
    description: 'The purchase price of the item',
  })
  @IsNumber({}, { message: 'نرخی کڕین دەبێت ژمارە بێت' })
  @IsPositive({ message: 'نرخی کڕین دەبێت ئەرێنی بێت' })
  @IsNotEmpty({ message: 'نرخی کڕین پێویستە' })
  item_produce_price: number;

  @ApiProperty({
    example: 100,
    description: 'The selling price of the item in plural',
  })
  @IsNumber({}, { message: 'نرخی فرۆشتنی کۆ دەبێت ژمارە بێت' })
  @IsOptional()
  item_plural_sell_price: number;

  @ApiProperty({
    example: 10,
    description: 'The selling price of a single item',
  })
  @IsNumber({}, { message: 'نرخی فرۆشتنی تاک دەبێت ژمارە بێت' })
  @IsOptional()
  item_single_sell_price: number;

  @ApiProperty({
    example: 90,
    description: 'The wholesale price of the item in plural',
  })
  @IsNumber({}, { message: 'نرخی کۆی بە کۆمەڵ دەبێت ژمارە بێت' })
  @IsOptional()
  item_plural_jumla_price: number;

  @ApiProperty({
    example: 9,
    description: 'The wholesale price of a single item',
  })
  @IsNumber({}, { message: 'نرخی تاکی بە کۆمەڵ دەبێت ژمارە بێت' })
  @IsOptional()
  item_single_jumla_price: number;

  @ApiProperty({
    example: 24,
    description: 'The number of items per carton',
  })
  @IsInt({ message: 'ژمارەی بڕگە لە کارتۆنێکدا دەبێت ژمارەی تەواو بێت' })
  @IsPositive({ message: 'ژمارەی بڕگە لە کارتۆنێکدا دەبێت ئەرێنی بێت' })
  @IsNotEmpty({ message: 'ژمارەی بڕگە لە کارتۆنێکدا پێویستە' })
  item_per_cartoon: number;

  @ApiProperty({
    example: 100,
    description: 'The quantity of the item in stock',
  })
  @IsNumber({}, { message: 'بڕ دەبێت ژمارە بێت' })
  @IsNotEmpty({ message: 'بڕ پێویستە' })
  @IsOptional()
  cartoon?: number;

  @ApiProperty({
    example: 'This is a note about the item.',
    description: 'Additional notes about the item',
    required: false,
  })
  @IsString({ message: 'تێبینی دەبێت ڕیزبەند بێت' })
  @IsOptional()
  note?: string;

  @ApiProperty({
    example: false,
    description: 'Whether the item is deleted',
    required: false,
  })
  @IsBoolean({ message: 'سڕاوەتەوە دەبێت بوڵی بێت' })
  @IsOptional()
  deleted?: boolean;
}
