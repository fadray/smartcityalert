import { Test, TestingModule } from '@nestjs/testing';
import { RespondersService } from './responders.service';

describe('RespondersService', () => {
  let service: RespondersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RespondersService],
    }).compile();

    service = module.get<RespondersService>(RespondersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
