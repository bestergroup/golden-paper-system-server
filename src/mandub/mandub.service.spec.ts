import { Test, TestingModule } from '@nestjs/testing';
import { MandubService } from './mandub.service';

describe('MandubService', () => {
  let service: MandubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MandubService],
    }).compile();

    service = module.get<MandubService>(MandubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
