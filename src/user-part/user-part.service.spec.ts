import { Test, TestingModule } from '@nestjs/testing';
import { UserPartService } from './user-part.service';

describe('UserPartService', () => {
  let service: UserPartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserPartService],
    }).compile();

    service = module.get<UserPartService>(UserPartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
