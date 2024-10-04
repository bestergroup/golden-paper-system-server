import { Test, TestingModule } from '@nestjs/testing';
import { MandubController } from './mandub.controller';
import { MandubService } from './mandub.service';

describe('MandubController', () => {
  let controller: MandubController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MandubController],
      providers: [MandubService],
    }).compile();

    controller = module.get<MandubController>(MandubController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
