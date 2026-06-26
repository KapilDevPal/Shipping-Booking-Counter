import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { LocationsService } from './locations.service';

@ApiTags('Locations')
@ApiBearerAuth()
@Controller('locations')
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Get list of countries from FlightGo' })
  getCountries() {
    return this.locationsService.getCountries();
  }

  @Get('zipcodes')
  @ApiOperation({ summary: 'Get zipcodes for a country' })
  @ApiQuery({ name: 'country', required: true, example: 'US' })
  getZipcodes(@Query('country') country: string) {
    return this.locationsService.getZipcodes(country);
  }
}
