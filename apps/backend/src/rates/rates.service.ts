import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { format } from 'date-fns';
import { FlightGoService } from '../integrations/flightgo/flightgo.service';
import { CheckRatesDto } from './dto/check-rates.dto';

@Injectable()
export class RatesService {
  private readonly apiKey: string;

  constructor(
    private flightGoService: FlightGoService,
    private config: ConfigService,
  ) {
    this.apiKey = config.get<string>('FLIGHTGO_API_KEY', '');
  }

  async checkRates(dto: CheckRatesDto) {
    const shipDate = dto.shipDate
      ? format(new Date(dto.shipDate), 'dd-MM-yyyy')
      : format(new Date(), 'dd-MM-yyyy');

    // Map frontend packageType ('PARCEL' or 'DOCUMENT') to FlightGo package_code ('NDX' or 'DOC')
    const packageCode = dto.packageType === 'DOCUMENT' ? 'DOC' : 'NDX';

    // Map frontend weight number to FlightGo weight object
    const weightObj = {
      value: dto.weight,
      units: 'kg',
    };

    // Map dimensions array to format expected by FlightGo
    const dimensionsObj = (dto.length && dto.width && dto.height) ? [{
      units: 'cm',
      length: dto.length,
      width: dto.width,
      height: dto.height,
      weightb: Math.round((dto.length * dto.width * dto.height) / 5000),
    }] : [];

    const rateRequest = {
      ship_date: shipDate,
      package_code: packageCode,
      to_country: dto.toCountry,
      zipcode_id: dto.toZipcodeId,
      weight: weightObj,
      dimensions: dimensionsObj,
    };

    const flightGoRates = await this.flightGoService.getRates(this.apiKey, rateRequest as any);

    // Normalize response into a consistent format matching the frontend's RateQuote interface
    const normalized = flightGoRates.map((r) => ({
      partnerCode: 'FLIGHTGO',
      partnerName: r.company.name,
      serviceCode: r.company.service_code,
      serviceName: `${r.company.name} (${r.company.branch_name})`,
      rate: r.rate.Rate,
      tax: r.rate['IGST (18%)'],
      totalAmount: r.rate['Grand Total'],
      transitDays: 3, // FlightGo default transit days
    }));

    // Sort by totalAmount (cheapest first)
    normalized.sort((a, b) => a.totalAmount - b.totalAmount);

    return {
      status: 'success',
      data: {
        rates: normalized,
        cheapest: normalized[0] || null,
        fastest: normalized[0] || null,
      },
    };
  }
}
