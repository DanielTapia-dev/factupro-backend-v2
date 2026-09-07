import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { CiudadanoService } from './../src/ciudadano/ciudadano.service';

describe('Database-free API', () => {
  let app: INestApplication<App>;
  const key = 'e2e-test-only-credential-32-characters';
  const service = {
    findCedula: jest.fn().mockResolvedValue({ name: 'fixture' }),
    findRuc: jest.fn(),
  };
  beforeAll(async () => {
    process.env.API_KEY = key;
    const { AppModule } = await import('../src/app.module');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CiudadanoService)
      .useValue(service)
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });
  afterAll(async () => {
    await app.close();
    delete process.env.API_KEY;
  });
  it('serves health without API credentials or external calls', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect(({ body }: { body: { status: string } }) =>
        expect(body.status).toBe('ok'),
      );
    expect(service.findCedula).not.toHaveBeenCalled();
  });
  it('rejects unauthorized consultations before calling a provider', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/ciudadano/cedula/fixture')
      .expect(401);
    expect(service.findCedula).not.toHaveBeenCalled();
  });
  it('routes an authorized consultation to the service', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/ciudadano/cedula/fixture')
      .set('api-key', key)
      .expect(200)
      .expect({ name: 'fixture' });
  });
});
