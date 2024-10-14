import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';

import {
  Filter,
  From,
  Id,
  Limit,
  Page,
  PaginationReturnType,
  Search,
  To,
} from 'src/types/global';
import { AuthGuard } from 'src/auth/auth.guard';
import { PartGuard } from 'src/auth/part.guard';
import { PartName } from 'src/auth/part.decorator';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ENUMs } from 'lib/enum';
import { City } from 'database/types';
import { CityService } from './city.service';
import UpdateCityDto from './dto/update-city-dto';
import CreateCityDto from './dto/create-city-dto';

@UseGuards(AuthGuard, PartGuard)
@ApiTags('city')
@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}
  @PartName([ENUMs.CITY_PART as string, ENUMs.USERS_PART as string])
  @ApiOperation({ summary: 'Get All Citys' })
  @ApiResponse({
    status: 200,
    description: 'Citys retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Citys not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('')
  async getAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<City[]>>> {
    try {
      let cities: PaginationReturnType<City[]> = await this.cityService.getAll(
        page,
        limit,
        from,
        to,
      );
      return res.status(HttpStatus.OK).json(cities);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName(['all'])
  @ApiOperation({ summary: 'Get Select Citys' })
  @ApiResponse({
    status: 200,
    description: 'Citys retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Citys not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/select')
  async getSelect(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<City[]>> {
    try {
      let cities: City[] = await this.cityService.getSelect();
      return res.status(HttpStatus.OK).json(cities);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CITY_PART as string, ENUMs.USERS_PART as string])
  @ApiOperation({ summary: 'Get All Deleted Citys' })
  @ApiResponse({
    status: 200,
    description: 'Deleted Citys retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Deleted Citys not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/deleted')
  async getAllDeleted(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<City[]>>> {
    try {
      let cities: PaginationReturnType<City[]> =
        await this.cityService.getAllDeleted(page, limit, from, to);
      return res.status(HttpStatus.OK).json(cities);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CITY_PART as string, ENUMs.USERS_PART as string])
  @ApiOperation({ summary: 'Search Citys' })
  @ApiResponse({
    status: 200,
    description: 'Citys retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Citys not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/search')
  async search(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<City[]>> {
    try {
      let cities: City[] = await this.cityService.search(search);
      return res.status(HttpStatus.OK).json(cities);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CITY_PART as string, ENUMs.USERS_PART as string])
  @ApiOperation({ summary: 'Search Citys' })
  @ApiResponse({
    status: 200,
    description: 'Citys retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Citys not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/deleted_search')
  async deletedSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<City[]>> {
    try {
      let cities: City[] = await this.cityService.deletedSearch(search);
      return res.status(HttpStatus.OK).json(cities);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.CITY_PART as string, ENUMs.USERS_PART as string])
  @ApiOperation({ summary: 'Add City' })
  @ApiResponse({
    status: 200,
    description: 'City created successfully.',
  })
  @HttpCode(HttpStatus.OK)
  @Post('')
  @UsePipes(new ValidationPipe())
  async create(
    @Body() body: CreateCityDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<City>> {
    try {
      const city: City = await this.cityService.create(body);
      return res.status(HttpStatus.OK).json(city);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CITY_PART as string, ENUMs.USERS_PART as string])
  @ApiOperation({
    summary: 'Resotre City By Id (deleted flag in database)',
  })
  @ApiParam({ name: 'id', description: 'City ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'City deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'City not found.' })
  @HttpCode(HttpStatus.OK)
  @Put('/restore/:id')
  async restore(
    @Param('id', ParseIntPipe) id: Id,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Id>> {
    try {
      const city: Id = await this.cityService.restore(id);
      return res.status(HttpStatus.OK).json(city);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CITY_PART as string, ENUMs.USERS_PART as string])
  @ApiOperation({ summary: 'Update City By Id' })
  @ApiParam({ name: 'id', description: 'City ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'City Updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'City not found.' })
  @HttpCode(HttpStatus.OK)
  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: Id,
    @Body() body: UpdateCityDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<City>> {
    try {
      const city: City = await this.cityService.update(id, body);
      return res.status(HttpStatus.OK).json(city);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CITY_PART as string, ENUMs.USERS_PART as string])
  @ApiOperation({
    summary: 'Delete City By Id (restore flag in database)',
  })
  @ApiParam({ name: 'id', description: 'City ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'City restore successfully.',
  })
  @ApiResponse({ status: 404, description: 'City not found.' })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: Id,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Id>> {
    try {
      const city: Id = await this.cityService.delete(id);
      return res.status(HttpStatus.OK).json(city);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
