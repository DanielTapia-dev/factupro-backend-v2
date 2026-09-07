import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok', revision: process.env.APP_REVISION || 'local' };
  }
}
