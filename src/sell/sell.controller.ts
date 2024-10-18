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
} from '@nestjs/common';
import { SellService } from './sell.service';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PartGuard } from 'src/auth/part.guard';
import { PartName } from 'src/auth/part.decorator';
import { ENUMs } from 'lib/enum';
import { Request, Response } from 'express';
import { Sell, SellItem } from 'database/types';
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
import { UpdateSellDto } from './dto/update-sell.dto';
import { AddItemToSellDto } from './dto/add-item-to-sell.dto';
import { UpdateItemToSellDto } from './dto/update-item-to-sell';
import { RestoreSellDto } from './dto/restore-sell.dto';
import { CreateSellDto } from './dto/create-sell.dto';
import { UpdateItemPriceInSellDto } from './dto/update-item-price-in-sell.dto';

@UseGuards(AuthGuard, PartGuard)
@ApiTags('sell')
@Controller('sell')
export class SellController {
  constructor(private readonly sellService: SellService) {}
  @PartName([ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Get All Sells' })
  @ApiResponse({ status: 200, description: 'Sells retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Sells not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('')
  async getAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('userFilter') userFilter: Filter,

    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<Sell[]>>> {
    try {
      let users: PaginationReturnType<Sell[]> = await this.sellService.getAll(
        page,
        limit,
        userFilter,
        from,
        to,
      );
      return res.status(HttpStatus.OK).json(users);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Get All Deleted Sells' })
  @ApiResponse({
    status: 200,
    description: 'Deleted Sells retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Deleted Sells not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/deleted')
  async getAllDeleted(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('userFilter') userFilter: Filter,

    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<Sell[]>>> {
    try {
      let users: PaginationReturnType<Sell[]> =
        await this.sellService.getAllDeleted(page, limit, userFilter, from, to);
      return res.status(HttpStatus.OK).json(users);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Search Sells' })
  @ApiResponse({ status: 200, description: 'Sells retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Sells not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/search')
  async search(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Sell[]>> {
    try {
      let users: Sell[] = await this.sellService.search(search);
      return res.status(HttpStatus.OK).json(users);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Search Sells' })
  @ApiResponse({ status: 200, description: 'Sells retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Sells not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/deleted_search')
  async deletedSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Sell[]>> {
    try {
      let users: Sell[] = await this.sellService.deletedSearch(search);
      return res.status(HttpStatus.OK).json(users);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Get Sell By Id' })
  @ApiParam({ name: 'id', description: 'Sell ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Sell retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Sell not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('sell/:id')
  async getOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: Id,
  ): Promise<Response<Sell>> {
    try {
      let sell: Sell = await this.sellService.findOne(id);
      return res.status(HttpStatus.OK).json(sell);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Get Sell Items By Id' })
  @ApiParam({ name: 'sell_id', description: 'Sell Id', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Sell Items retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Sell Items not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('sell_items/:sell_id')
  async getSellItems(
    @Req() req: Request,
    @Res() res: Response,
    @Param('sell_id', ParseIntPipe) sell_id: Id,
  ): Promise<Response<SellItem[]>> {
    try {
      let sellItems: SellItem[] = await this.sellService.getSellItems(sell_id);
      return res.status(HttpStatus.OK).json(sellItems);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Get Deleted Sell Items By Id' })
  @ApiResponse({
    status: 200,
    description: 'Deleted Sell Items retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Deleted Sell Items not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('self_deleted_sell_items')
  async getSelfDeletedSellItems(
    @Req() req: Request,
    @Res() res: Response,
    @Query('userFilter') userFilter: Filter,

    @Query('page') page: Page,
    @Query('limit') limit: Limit,
  ): Promise<Response<PaginationReturnType<SellItem[]>>> {
    try {
      let sellItems: PaginationReturnType<SellItem[]> =
        await this.sellService.getSelfDeletedSellItems(page, limit, userFilter);
      return res.status(HttpStatus.OK).json(sellItems);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Get Deleted Sell Items By Id' })
  @ApiResponse({
    status: 200,
    description: 'Deleted Sell Items retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Deleted Sell Items not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('search_deleted_sell_items')
  async searchSelfDeletedSellItems(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<SellItem[]>> {
    try {
      let sellItems: SellItem[] =
        await this.sellService.searchSelfDeletedSellItems(search);
      return res.status(HttpStatus.OK).json(sellItems);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Get Sell Items By Id' })
  @ApiParam({ name: 'sell_id', description: 'Sell Id', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Sell Items retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Sell Items not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('deleted_sell_items/:sell_id')
  async getDeletedSellItems(
    @Req() req: Request,
    @Res() res: Response,
    @Param('sell_id', ParseIntPipe) sell_id: Id,
  ): Promise<Response<SellItem[]>> {
    try {
      let sellItems: SellItem[] =
        await this.sellService.getDeletedSellItems(sell_id);
      return res.status(HttpStatus.OK).json(sellItems);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Add Sell' })
  @ApiResponse({ status: 200, description: 'Sell created successfully.' })
  @HttpCode(HttpStatus.OK)
  @Post('')
  async create(
    @Body() body: CreateSellDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Sell>> {
    try {
      const sell: Sell = await this.sellService.create(
        req['user'].id,
        body.mandubId,
        body.customerId,
        body.sellType,
      );
      return res.status(HttpStatus.OK).json(sell);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Print Sell' })
  @ApiParam({ name: 'sell_id', description: 'Sell ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Sell created successfully.' })
  @HttpCode(HttpStatus.OK)
  @Get('print/:sell_id/:where')
  async print(
    @Req() req: Request,
    @Res() res: Response,
    @Param('sell_id', ParseIntPipe) sell_id: Id,
    @Param('where') where: 'pos' | 'items',
  ): Promise<Response<string | Uint8Array>> {
    try {
      let data = await this.sellService.print(sell_id, req['user'].id, where);
      if (data.items_print_modal) {
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="sell_report.pdf"',
          'Content-Length': data.data.length,
        });
        res.end(data.data);
      } else {
        res.status(HttpStatus.OK).json({ data: data.data });
      }
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'restore Sell' })
  @ApiParam({ name: 'id', description: 'Sell ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Sell created successfully.' })
  @HttpCode(HttpStatus.OK)
  @Put('restore/:id')
  async restore(
    @Body() body: RestoreSellDto,

    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: Id,
  ): Promise<Response<Id>> {
    try {
      const sell: Id = await this.sellService.restore(id, body);
      return res.status(HttpStatus.OK).json(sell);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'restore Sell' })
  @ApiParam({ name: 'id', description: 'Sell ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Sell created successfully.' })
  @HttpCode(HttpStatus.OK)
  @Put('restore_self_deleted_sell_item/:id')
  async restoreSelfDeletedSellItem(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: Id,
  ): Promise<Response<Id>> {
    try {
      const sell: Id = await this.sellService.restoreSelfDeletedSellItem(id);
      return res.status(HttpStatus.OK).json(sell);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Add Sell' })
  @ApiParam({ name: 'id', description: 'Sell ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Sell created successfully.' })
  @HttpCode(HttpStatus.OK)
  @Put(':id')
  async update(
    @Body() body: UpdateSellDto,
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: Id,
  ): Promise<Response<Sell>> {
    try {
      const sell: Sell = await this.sellService.update(
        id,
        body,
        req['user'].id,
      );
      return res.status(HttpStatus.OK).json(sell);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Add Item to Sell' })
  @ApiParam({ name: 'sell_id', description: 'Sell ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Sell Item Added successfully.' })
  @HttpCode(HttpStatus.OK)
  @Put('add_item_to_sell/:sell_id')
  async addItemToSell(
    @Body() body: AddItemToSellDto,
    @Req() req: Request,
    @Res() res: Response,
    @Param('sell_id', ParseIntPipe) sell_id: Id,
  ): Promise<Response<SellItem>> {
    try {
      const sell_item: SellItem = await this.sellService.addItemToSell(
        sell_id,
        body,
        req['user'].id,
      );
      return res.status(HttpStatus.OK).json(sell_item);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Update Item to Sell' })
  @ApiParam({ name: 'sell_id', description: 'Sell ID', example: 1 })
  @ApiParam({ name: 'item_id', description: 'Item ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Sell Item Update successfully.' })
  @HttpCode(HttpStatus.OK)
  @Put('update_item_in_sell/:sell_id/:item_id/:addWay')
  async updateItemInSell(
    @Body() body: UpdateItemToSellDto,
    @Req() req: Request,
    @Res() res: Response,
    @Param('sell_id', ParseIntPipe) sell_id: Id,
    @Param('item_id', ParseIntPipe) item_id: Id,
    @Param('addWay') addWay: 'cartoon' | 'single',
  ): Promise<Response<SellItem>> {
    try {
      const sell_item: SellItem = await this.sellService.updateItemInSell(
        sell_id,
        item_id,
        body,
        req['user'].id,
        addWay,
      );
      return res.status(HttpStatus.OK).json(sell_item);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Update Item to Sell' })
  @ApiParam({ name: 'sell_id', description: 'Sell ID', example: 1 })
  @ApiParam({ name: 'item_id', description: 'Item ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Sell Item Update successfully.' })
  @HttpCode(HttpStatus.OK)
  @Put('update_item_price_in_sell/:sell_id/:item_id')
  async updateItemPriceInSell(
    @Body() body: UpdateItemPriceInSellDto,
    @Req() req: Request,
    @Res() res: Response,
    @Param('sell_id', ParseIntPipe) sell_id: Id,
    @Param('item_id', ParseIntPipe) item_id: Id,
  ): Promise<Response<SellItem>> {
    try {
      const sell_item: SellItem = await this.sellService.updateItemPriceInSell(
        sell_id,
        item_id,
        body,
        req['user'].id,
      );
      return res.status(HttpStatus.OK).json(sell_item);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Update Item to Sell' })
  @ApiParam({ name: 'sell_id', description: 'Sell ID', example: 1 })
  @ApiParam({ name: 'item_id', description: 'Item ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Sell Item Update successfully.' })
  @HttpCode(HttpStatus.OK)
  @Put('increase_item_in_sell/:sell_id/:item_id/:addWay')
  async increaseItemInSell(
    @Req() req: Request,
    @Res() res: Response,
    @Param('sell_id', ParseIntPipe) sell_id: Id,
    @Param('item_id', ParseIntPipe) item_id: Id,
    @Param('addWay') addWay: 'single' | 'cartoon',
  ): Promise<Response<SellItem>> {
    try {
      const sell_item: SellItem = await this.sellService.increaseItemInSell(
        sell_id,
        item_id,
        addWay,
        req['user'].id,
      );
      return res.status(HttpStatus.OK).json(sell_item);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Update Item to Sell' })
  @ApiParam({ name: 'sell_id', description: 'Sell ID', example: 1 })
  @ApiParam({ name: 'item_id', description: 'Item ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Sell Item Update successfully.' })
  @HttpCode(HttpStatus.OK)
  @Put('decrease_item_in_sell/:sell_id/:item_id/:addWay')
  async decreaseItemInSell(
    @Req() req: Request,
    @Res() res: Response,
    @Param('sell_id', ParseIntPipe) sell_id: Id,
    @Param('item_id', ParseIntPipe) item_id: Id,
    @Param('addWay') addWay: 'single' | 'cartoon',
  ): Promise<Response<SellItem>> {
    try {
      const sell_item: SellItem = await this.sellService.decreaseItemInSell(
        sell_id,
        item_id,
        addWay,

        req['user'].id,
      );
      return res.status(HttpStatus.OK).json(sell_item);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Delete Item to Sell' })
  @ApiParam({ name: 'sell_id', description: 'Sell ID', example: 1 })
  @ApiParam({ name: 'item_id', description: 'Item ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Sell Item Delete successfully.' })
  @HttpCode(HttpStatus.OK)
  @Put('delete_item_in_sell/:sell_id/:item_id')
  async deleteItemInSell(
    @Req() req: Request,
    @Res() res: Response,
    @Param('sell_id', ParseIntPipe) sell_id: Id,
    @Param('item_id', ParseIntPipe) item_id: Id,
  ): Promise<Response<Id>> {
    try {
      const sell_item: Id = await this.sellService.deleteItemInSell(
        sell_id,
        item_id,
      );
      return res.status(HttpStatus.OK).json(sell_item);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CREATE_PSULA_PART as string, ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Delete Sell By Id (restore flag in database)' })
  @ApiParam({ name: 'id', description: 'Sell ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Sell restore successfully.' })
  @ApiResponse({ status: 404, description: 'Sell not found.' })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: Id,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Id>> {
    try {
      const sell: Id = await this.sellService.delete(id);
      return res.status(HttpStatus.OK).json(sell);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
