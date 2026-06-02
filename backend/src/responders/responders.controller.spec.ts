import { Test, TestingModule } from '@nestjs/testing';
import { RespondersController } from './responders.controller';

describe('RespondersController', () => {
  let controller: RespondersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RespondersController],
    }).compile();

    controller = module.get<RespondersController>(RespondersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
