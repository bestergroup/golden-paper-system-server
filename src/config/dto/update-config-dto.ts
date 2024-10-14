import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UpdateConfigDto {
  @ApiProperty({
    example: true,
    description: 'The any value to update the config',
    required: true,
  })
  @IsNotEmpty({ message: 'بەها پێویستە' })
  value: any;
}
