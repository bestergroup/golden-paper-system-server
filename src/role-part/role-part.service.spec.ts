import { Test, TestingModule } from '@nestjs/testing';
import { RolePartService } from './role-part.service';

describe('RolePartService', () => {
  let service: RolePartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolePartService],
    }).compile();

    service = module.get<RolePartService>(RolePartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
