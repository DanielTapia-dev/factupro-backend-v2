import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CiudadanoService {
  async findCedula(id: string) {
    try {
      const response = await axios.post(
        `https://app3902.privynote.net/api/v1/client/find-names`,
        {
          identification: id,
        },
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return response.data['data'];
    } catch (error: any) {
      return `${error}`;
    }
  }

  async findRuc(id: string) {
    try {
      const response = await axios.get(
        `https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/ConsolidadoContribuyente/obtenerPorNumerosRuc?&ruc=${id}`,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return response.data[0];
    } catch (error: any) {
      return `${error}`;
    }
  }
}
