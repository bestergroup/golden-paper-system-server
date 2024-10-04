import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsInt,
} from 'class-validator';
import { Id } from 'src/types/global';

export default class UpdateRoleDto {
  @ApiProperty({
    example: 'Admin',
    description: 'The name of the role',
    required: true,
  })
  @IsString({ message: 'ناوی ڕۆڵ دەبێت ڕشتە بێت' })
  @IsNotEmpty({ message: 'ناوی ڕۆڵ پێویستە' })
  name: string;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'The IDs of the associated parts',
    required: true,
  })
  @IsArray({ message: 'ئایدی بەشەکان دەبێت لیست بێت' })
  @ArrayNotEmpty({ message: 'لیستی ئایدی بەشەکان نابێت بەتاڵ بێت' })
  @IsInt({ each: true, message: 'هەر ئایدی بەشێک دەبێت ژمارەیەکی تەواو بێت' })
  @IsNotEmpty({ message: 'ئایدی بەشەکان پێویستن' })
  part_ids: Id[];
}
