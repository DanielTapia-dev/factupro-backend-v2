import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { CiudadanoService } from './ciudadano.service';
import { ApiKeyGuard } from '../guards/api-key/api-key.guard';

@Controller('ciudadano')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
export class CiudadanoController {
  constructor(private readonly ciudadanoService: CiudadanoService) {}

  @Get('cedula/:id')
  findCedula(@Param('id') id: string) {
    return this.ciudadanoService.findCedula(id);
  }

  @Get('ruc/:id')
  findRuc(@Param('id') id: string) {
    return this.ciudadanoService.findRuc(id);
  }
}
