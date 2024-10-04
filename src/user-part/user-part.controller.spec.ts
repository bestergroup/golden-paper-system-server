import { Test, TestingModule } from '@nestjs/testing';
import { UserPartController } from './user-part.controller';
import { UserPartService } from './user-part.service';

describe('UserPartController', () => {
  let controller: UserPartController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPartController],
      providers: [UserPartService],
    }).compile();

    controller = module.get<UserPartController>(UserPartController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
