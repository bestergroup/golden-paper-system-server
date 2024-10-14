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
import { PrinterService } from './printer.service';
import { Request, Response } from 'express';

import {
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

import { Printer } from 'database/types';
import CreatePrinterDto from './dto/create-printer.dto';
import UpdatePrinterDto from './dto/update-printer.dto';

@UseGuards(AuthGuard, PartGuard)
@ApiTags('printer')
@Controller('printer')
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}
  @PartName([ENUMs.PRINTER_PART as string])
  @ApiOperation({ summary: 'Get All Printers' })
  @ApiResponse({
    status: 200,
    description: 'Printers retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Printers not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('')
  async getAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<Printer[]>>> {
    try {
      let printers: PaginationReturnType<Printer[]> =
        await this.printerService.getAll(page, limit, from, to);
      return res.status(HttpStatus.OK).json(printers);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName(['all'])
  @ApiOperation({ summary: 'Get Select Printers' })
  @ApiResponse({
    status: 200,
    description: 'Printers retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Printers not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/select')
  async getSelect(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Printer[]>> {
    try {
      let printers: Printer[] = await this.printerService.getSelect();
      return res.status(HttpStatus.OK).json(printers);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.PRINTER_PART as string])
  @ApiOperation({ summary: 'Get All Deleted Printers' })
  @ApiResponse({
    status: 200,
    description: 'Deleted Printers retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Deleted Printers not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/deleted')
  async getAllDeleted(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<Printer[]>>> {
    try {
      let printers: PaginationReturnType<Printer[]> =
        await this.printerService.getAllDeleted(page, limit, from, to);
      return res.status(HttpStatus.OK).json(printers);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.PRINTER_PART as string])
  @ApiOperation({ summary: 'Search Printers' })
  @ApiResponse({
    status: 200,
    description: 'Printers retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Printers not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/search')
  async search(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Printer[]>> {
    try {
      let printers: Printer[] = await this.printerService.search(search);
      return res.status(HttpStatus.OK).json(printers);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.PRINTER_PART as string])
  @ApiOperation({ summary: 'Search Printers' })
  @ApiResponse({
    status: 200,
    description: 'Printers retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Printers not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/deleted_search')
  async deletedSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Printer[]>> {
    try {
      let printers: Printer[] = await this.printerService.deletedSearch(search);
      return res.status(HttpStatus.OK).json(printers);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.PRINTER_PART as string])
  @ApiOperation({ summary: 'Add Printer' })
  @ApiResponse({
    status: 200,
    description: 'Printer created successfully.',
  })
  @HttpCode(HttpStatus.OK)
  @Post('')
  @UsePipes(new ValidationPipe())
  async create(
    @Body() body: CreatePrinterDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Printer>> {
    try {
      const printer: Printer = await this.printerService.create(body);
      return res.status(HttpStatus.OK).json(printer);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.PRINTER_PART as string])
  @ApiOperation({
    summary: 'Resotre Printer By Id (deleted flag in database)',
  })
  @ApiParam({ name: 'id', description: 'Printer ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Printer deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Printer not found.' })
  @HttpCode(HttpStatus.OK)
  @Put('/restore/:id')
  async restore(
    @Param('id', ParseIntPipe) id: Id,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Id>> {
    try {
      const printer: Id = await this.printerService.restore(id);
      return res.status(HttpStatus.OK).json(printer);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.PRINTER_PART as string])
  @ApiOperation({ summary: 'Update Printer By Id' })
  @ApiParam({ name: 'id', description: 'Printer ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Printer Updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Printer not found.' })
  @HttpCode(HttpStatus.OK)
  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: Id,
    @Body() body: UpdatePrinterDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Printer>> {
    try {
      const printer: Printer = await this.printerService.update(id, body);
      return res.status(HttpStatus.OK).json(printer);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.PRINTER_PART as string])
  @ApiOperation({ summary: 'Update Printer By Id' })
  @ApiParam({ name: 'id', description: 'Printer ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Printer Updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Printer not found.' })
  @HttpCode(HttpStatus.OK)
  @Put('state/:id')
  @UsePipes(new ValidationPipe())
  async updateState(
    @Param('id', ParseIntPipe) id: Id,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Printer>> {
    try {
      const printer: Printer = await this.printerService.updateState(id);
      return res.status(HttpStatus.OK).json(printer);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.PRINTER_PART as string])
  @ApiOperation({
    summary: 'Delete Printer By Id (restore flag in database)',
  })
  @ApiParam({ name: 'id', description: 'Printer ID', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Printer restore successfully.',
  })
  @ApiResponse({ status: 404, description: 'Printer not found.' })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: Id,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Id>> {
    try {
      const printer: Id = await this.printerService.delete(id);
      return res.status(HttpStatus.OK).json(printer);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
