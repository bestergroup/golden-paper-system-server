import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateItemToSellDto {
  @ApiProperty({
    example: 50,
    description: 'quantity of the item',
  })
  @IsNumber({}, { message: 'quantity price must be a number' })
  @IsPositive({ message: 'quantity price must be positive' })
  @IsNotEmpty({ message: 'quantity price is required' })
  quantity: number;
}
