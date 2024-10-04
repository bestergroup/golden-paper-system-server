import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Id } from 'src/types/global';

export default class UpdateUserDto {
  @ApiProperty({ example: 'JohnDoe', description: 'The username of the user' })
  @IsString({ message: 'ناوی بەکارهێنەر دەبێت ڕشتە بێت' })
  @IsNotEmpty({ message: 'ناوی بەکارهێنەر پێویستە' })
  @MinLength(3, { message: 'ناوی بەکارهێنەر دەبێت لانیکەم ٣ پیت بێت' })
  @MaxLength(30, { message: 'ناوی بەکارهێنەر دەبێت زۆر نەبێت لە ٣٠ پیت' })
  username: string;

  @ApiProperty({ example: 'JohnDoe', description: 'The password of the user' })
  @IsString({ message: 'وشەی نهێنی دەبێت ڕشتە بێت' })
  @IsNotEmpty({ message: 'وشەی نهێنی پێویستە' })
  @MinLength(3, { message: 'وشەی نهێنی دەبێت لانیکەم ٣ پیت بێت' })
  @MaxLength(30, { message: 'وشەی نهێنی دەبێت زۆر نەبێت لە ٣٠ پیت' })
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'The full name of the user',
  })
  @IsString({ message: 'ناو دەبێت ڕشتە بێت' })
  @IsNotEmpty({ message: 'ناو پێویستە' })
  name: string;
  @ApiProperty({
    example: 'John Doe',
    description: 'The full street of the user',
  })
  @IsString({ message: 'ناو دەبێت ڕشتە بێت' })
  @IsNotEmpty({ message: 'ناو پێویستە' })
  street: string;

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
    example: '1234567890',
    description: 'The phone number of the user',
  })
  @IsString({ message: 'ژمارە تەلەفۆن دەبێت ڕشتە بێت' })
  @IsNotEmpty({ message: 'ژمارە تەلەفۆن پێویستە' })
  phone: string;

  @ApiProperty({ example: '1', description: 'The role ID of the user' })
  @IsNotEmpty({ message: 'ئایدی ڕۆڵ پێویستە' })
  @IsInt({ message: 'ئایدی ڕۆڵ دەبێت ژمارەیەکی تەواو بێت' })
  role_id: Id;
  @ApiProperty({ example: '1', description: 'The role ID of the user' })
  @IsNotEmpty({ message: 'ئایدی شار پێویستە' })
  @IsInt({ message: 'ئایدی شار دەبێت ژمارەیەکی تەواو بێت' })
  city_id: Id;
  @ApiProperty({
    example: '[1, 2, 3]',
    description: 'The part IDs of the user',
  })
  @IsNotEmpty({ message: 'ئایدی بەشەکان پێویستن' })
  @ArrayNotEmpty({ message: 'لیستی بەشەکان نابێت بەتاڵ بێت' })
  @IsInt({ each: true, message: 'هەر ئایدی بەشێک دەبێت ژمارەیەکی تەواو بێت' })
  part_ids: Id[];

  @ApiProperty({
    example: false,
    description: 'Indicates whether the employee is deleted or not',
  })
  @IsBoolean({ message: 'سڕینەوە دەبێت بەڵێ/نەخێر بێت' })
  @IsOptional()
  deleted?: boolean;
}
