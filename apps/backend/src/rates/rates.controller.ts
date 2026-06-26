import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RatesService } from './rates.service';
import { CheckRatesDto } from './dto/check-rates.dto';

@ApiTags('Rates')
@ApiBearerAuth()
@Controller('rates')
export class RatesController {
  constructor(private ratesService: RatesService) {}

  @Post('check')
  @ApiOperation({ summary: 'Check shipping rates from FlightGo' })
  checkRates(@Body() dto: CheckRatesDto) {
    return this.ratesService.checkRates(dto);
  }
}
