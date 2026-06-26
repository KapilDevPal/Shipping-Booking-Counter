import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FlightGoService } from '../integrations/flightgo/flightgo.service';

@Injectable()
export class LocationsService {
  private readonly apiKey: string;

  constructor(
    private flightGoService: FlightGoService,
    private config: ConfigService,
  ) {
    this.apiKey = config.get<string>('FLIGHTGO_API_KEY', '');
  }

  async getCountries() {
    const data = await this.flightGoService.getCountries(this.apiKey);
    return { status: 'success', data };
  }

  async getZipcodes(countryCode: string) {
    const data = await this.flightGoService.getZipcodes(this.apiKey, countryCode);
    return { status: 'success', data };
  }
}
