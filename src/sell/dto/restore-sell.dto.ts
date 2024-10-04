import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RestoreSellDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of item IDs',
  })
  @IsArray({ message: 'item_ids must be an array' })
  @IsNumber({}, { each: true, message: 'Each item_id must be a number' })
  @IsOptional()
  item_ids: number[];
}
