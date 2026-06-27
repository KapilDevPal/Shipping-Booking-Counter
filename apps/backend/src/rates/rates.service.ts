import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { format } from 'date-fns';
import { FlightGoService } from '../integrations/flightgo/flightgo.service';
import { DhlService } from '../integrations/dhl/dhl.service';
import { CheckRatesDto } from './dto/check-rates.dto';

@Injectable()
export class RatesService {
  private readonly logger = new Logger(RatesService.name);
  private readonly apiKey: string;

  constructor(
    private flightGoService: FlightGoService,
    private dhlService: DhlService,
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

    const ratePromises = [
      // 1. FlightGo Rate Request
      this.flightGoService.getRates(this.apiKey, rateRequest as any)
        .then((flightGoRates) => {
          return flightGoRates.map((r) => ({
            partnerCode: 'FLIGHTGO',
            partnerName: r.company.name,
            serviceCode: r.company.service_code,
            serviceName: `${r.company.name} (${r.company.branch_name})`,
            rate: r.rate.Rate,
            tax: r.rate['IGST (18%)'],
            totalAmount: r.rate['Grand Total'],
            transitDays: 3,
          }));
        })
        .catch((err) => {
          this.logger.error(`Error checking FlightGo rates: ${err.message}`);
          return [];
        }),

      // 2. DHL Rate Request
      this.dhlService.getRates(dto)
        .then((dhlRates) => {
          return dhlRates.map((r) => ({
            partnerCode: 'DHL',
            partnerName: 'DHL Express',
            serviceCode: r.serviceCode,
            serviceName: r.serviceName,
            rate: r.rate,
            tax: r.tax,
            totalAmount: r.totalAmount,
            transitDays: r.transitDays,
          }));
        })
        .catch((err) => {
          this.logger.error(`Error checking DHL rates: ${err.message}`);
          return [];
        }),
    ];

    const results = await Promise.all(ratePromises);
    const combined = [...results[0], ...results[1]];

    // Sort by totalAmount (cheapest first)
    combined.sort((a, b) => a.totalAmount - b.totalAmount);

    // Find cheapest & fastest across all
    let cheapest = combined[0] || null;
    let fastest = combined[0] || null;

    combined.forEach((q) => {
      if (cheapest && q.totalAmount < cheapest.totalAmount) {
        cheapest = q;
      }
      if (fastest && q.transitDays < fastest.transitDays) {
        fastest = q;
      }
    });

    return {
      status: 'success',
      data: {
        rates: combined,
        cheapest,
        fastest,
      },
    };
  }
}

