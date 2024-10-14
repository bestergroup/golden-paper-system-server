import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePartDto {
  @ApiProperty({
    example: 'Electronics',
    description: 'The name of the part',
  })
  @IsString({ message: 'ناو دەبێت نووسین بێت' })
  @IsNotEmpty({ message: 'ناو پێویستە' })
  name: string;
}
