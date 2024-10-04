import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,

} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeItemQuantityDto {

  @ApiProperty({
    example: 100,
    description: 'The quantity of the item in stock',
  })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsPositive({ message: 'Quantity must be positive' })
  @IsNotEmpty({ message: 'Quantity is required' })
  @IsOptional()
  quantity: number;


}
