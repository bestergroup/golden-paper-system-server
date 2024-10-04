import { SetMetadata } from '@nestjs/common';

export const PartName = (partName: string[]) =>
  SetMetadata('partName', partName);
