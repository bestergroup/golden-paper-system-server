import { Test, TestingModule } from '@nestjs/testing';
import { RolePartController } from './role-part.controller';
import { RolePartService } from './role-part.service';

describe('RolePartController', () => {
  let controller: RolePartController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolePartController],
      providers: [RolePartService],
    }).compile();

    controller = module.get<RolePartController>(RolePartController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
