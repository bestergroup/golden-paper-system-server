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
import { MandubService } from './mandub.service';
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
import { Mandub } from 'database/types';
import { PartGuard } from 'src/auth/part.guard';
import { PartName } from 'src/auth/part.decorator';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ENUMs } from 'lib/enum';
import CreateMandubDto from './dto/create-mandub-dto';
import UpdateMandubDto from './dto/update-mandub-dto';

@UseGuards(AuthGuard, PartGuard)
@ApiTags('mandub')
@Controller('mandub')
export class MandubController {
  constructor(private readonly mandubService: MandubService) {}
  @PartName([ENUMs.MANDUBS_PART as string])
  @ApiOperation({ summary: 'Get All Mandubs' })
  @ApiResponse({
    status: 200,
    description: 'Mandubs retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Mandubs not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('')
  async getAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('filter') filter: Filter,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<Mandub[]>>> {
    try {
      let mandubs: PaginationReturnType<Mandub[]> =
        await this.mandubService.getAll(page, limit, filter, from, to);
      return res.status(HttpStatus.OK).json(mandubs);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName(['all'])
  @ApiOperation({ summary: 'Get Select Mandubs' })
  @ApiResponse({
    status: 200,
    description: 'Mandubs retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Mandubs not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/select')
  async getSelect(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Mandub[]>> {
    try {
      let mandubs: Mandub[] = await this.mandubService.getSelect();
      return res.status(HttpStatus.OK).json(mandubs);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.MANDUBS_PART as string])
  @ApiOperation({ summary: 'Get All Deleted Mandubs' })
  @ApiResponse({
    status: 200,
    description: 'Deleted Mandubs retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Deleted Mandubs not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/deleted')
  async getAllDeleted(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('filter') filter: Filter,

    @Query('limit') limit: Limit,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<Mandub[]>>> {
    try {
      let mandubs: PaginationReturnType<Mandub[]> =
        await this.mandubService.getAllDeleted(page, limit, filter, from, to);
      return res.status(HttpStatus.OK).json(mandubs);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.MANDUBS_PART as string])
  @ApiOperation({ summary: 'Search Mandubs' })
  @ApiResponse({
    status: 200,
    description: 'Mandubs retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Mandubs not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/search')
  async search(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Mandub[]>> {
    try {
      let mandubs: Mandub[] = await this.mandubService.search(search);
      return res.status(HttpStatus.OK).json(mandubs);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.MANDUBS_PART as string])
  @ApiOperation({ summary: 'Search Mandubs' })
  @ApiResponse({
    status: 200,
    description: 'Mandubs retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Mandubs not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/deleted_search')
  async deletedSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Mandub[]>> {
    try {
      let mandubs: Mandub[] = await this.mandubService.deletedSearch(search);
      return res.status(HttpStatus.OK).json(mandubs);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.MANDUBS_PART as string])
  @ApiOperation({ summary: 'Get Mandub By Id' })
  @ApiParam({ name: 'id', description: 'Mandub ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Mandub retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Mandub not found.' })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async getOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: Id,
  ): Promise<Response<Mandub>> {
    try {
      let mandub: Mandub = await this.mandubService.findOne(id);
      return res.status(HttpStatus.OK).json(mandub);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.MANDUBS_PART as string])
  @ApiOperation({ summary: 'Add Mandub' })
  @ApiResponse({ status: 200, description: 'Mandub created successfully.' })
  @HttpCode(HttpStatus.OK)
  @Post('')
  @UsePipes(new ValidationPipe())
  async create(
    @Body() body: CreateMandubDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Mandub>> {
    try {
      const mandub: Mandub = await this.mandubService.create(
        body,
        req['user'].id,
      );
      return res.status(HttpStatus.OK).json(mandub);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.MANDUBS_PART as string])
  @ApiOperation({
    summary: 'Resotre Mandub By Id (deleted flag in database)',
  })
  @ApiParam({ name: 'id', description: 'Mandub ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Mandub deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Mandub not found.' })
  @HttpCode(HttpStatus.OK)
  @Put('/restore/:id')
  async restore(
    @Param('id', ParseIntPipe) id: Id,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Id>> {
    try {
      const mandub: Id = await this.mandubService.restore(id);
      return res.status(HttpStatus.OK).json(mandub);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.MANDUBS_PART as string])
  @ApiOperation({ summary: 'Update Mandub By Id' })
  @ApiParam({ name: 'id', description: 'Mandub ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Mandub Updated successfully.' })
  @ApiResponse({ status: 404, description: 'Mandub not found.' })
  @HttpCode(HttpStatus.OK)
  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: Id,
    @Body() body: UpdateMandubDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Mandub>> {
    try {
      const mandub: Mandub = await this.mandubService.update(
        id,
        body,
        req['user'].id,
      );
      return res.status(HttpStatus.OK).json(mandub);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.MANDUBS_PART as string])
  @ApiOperation({ summary: 'Delete Mandub By Id (restore flag in database)' })
  @ApiParam({ name: 'id', description: 'Mandub ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Mandub restore successfully.' })
  @ApiResponse({ status: 404, description: 'Mandub not found.' })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: Id,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Id>> {
    try {
      const mandub: Id = await this.mandubService.delete(id);
      return res.status(HttpStatus.OK).json(mandub);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
