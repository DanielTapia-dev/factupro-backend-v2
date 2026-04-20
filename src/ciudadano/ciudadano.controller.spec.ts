import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CiudadanoController } from './ciudadano.controller';
import { CiudadanoService } from './ciudadano.service';

describe('CiudadanoController', () => {
  let controller: CiudadanoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CiudadanoController],
      providers: [
        CiudadanoService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CiudadanoController>(CiudadanoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
