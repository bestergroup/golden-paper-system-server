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
import { AuthGuard } from 'src/auth/auth.guard';

import { ItemService } from './item.service';

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
import { CreateItemDto } from './dto/create-item-dto';
import { UpdateItemDto } from './dto/update-item-dto';
import { PartGuard } from 'src/auth/part.guard';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PartName } from 'src/auth/part.decorator';
import { ENUMs } from 'lib/enum';
import { ChangeItemQuantityDto } from './dto/change-item-quantity-dto';
import { Item } from 'database/types';

@UseGuards(AuthGuard, PartGuard)
@ApiTags('item')
@Controller('item')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}
  @PartName([ENUMs.KOGA_PART as string])
  @ApiOperation({ summary: 'Get All Items' })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Items not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('')
  async getAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('filter') filter: Filter,
    @Query('userFilter') userFilter: Filter,

    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<Item[]>>> {
    try {
      let items: PaginationReturnType<Item[]> = await this.itemService.getAll(
        page,
        limit,
        filter,
        userFilter,
        from,
        to,
      );
      return res.status(HttpStatus.OK).json(items);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.KOGA_PART as string])
  @ApiOperation({ summary: 'Get All Items' })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Items not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/deleted')
  async getAllDeleted(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('filter') filter: Filter,
    @Query('userFilter') userFilter: Filter,

    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<Item[]>>> {
    try {
      let items: PaginationReturnType<Item[]> =
        await this.itemService.getAllDeleted(
          page,
          limit,
          filter,
          userFilter,
          from,
          to,
        );
      return res.status(HttpStatus.OK).json(items);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.KOGA_PART as string])
  @ApiOperation({ summary: 'Get All Items' })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Items not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/less')
  async getLess(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('userFilter') userFilter: Filter,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<Item[]>>> {
    try {
      let items: PaginationReturnType<Item[]> = await this.itemService.getLess(
        page,
        limit,
        userFilter,
        from,
        to,
      );
      return res.status(HttpStatus.OK).json(items);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.KOGA_PART as string])
  @ApiOperation({ summary: 'Search Items' })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Items not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/search')
  async search(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Item[]>> {
    try {
      let items: Item[] = await this.itemService.search(search);
      return res.status(HttpStatus.OK).json(items);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.KOGA_PART as string])
  @ApiOperation({ summary: 'Search Items' })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Items not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/search_less')
  async searchLess(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Item[]>> {
    try {
      let items: Item[] = await this.itemService.searchLess(search);
      return res.status(HttpStatus.OK).json(items);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.KOGA_PART as string])
  @ApiOperation({ summary: 'Search Items' })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Items not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/deleted_search')
  async deletedSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Item[]>> {
    try {
      let items: Item[] = await this.itemService.deletedSearch(search);
      return res.status(HttpStatus.OK).json(items);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.KOGA_PART as string])
  @ApiOperation({ summary: 'Get One Item' })
  @ApiResponse({
    status: 200,
    description: 'Item retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @ApiParam({ name: 'id', description: 'Item ID', example: 1 })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async getOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: Id,
  ): Promise<Response<Item>> {
    try {
      let item: Item = await this.itemService.findOne(id);
      return res.status(HttpStatus.OK).json(item);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.KOGA_PART as string])
  @ApiOperation({ summary: 'Add Item' })
  @ApiResponse({
    status: 200,
    description: 'Item Added successfully.',
  })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Post()
  @UsePipes(new ValidationPipe())
  async create(
    @Body() body: CreateItemDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Item>> {
    try {
      const item: Item = await this.itemService.create(body, req['user'].id);
      return res.status(HttpStatus.OK).json(item);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.USERS_PART as string])
  @ApiOperation({ summary: 'Resotre Item By Id (deleted flag in database)' })
  @ApiParam({ name: 'id', description: 'Item ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Item deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Put('/restore/:id')
  async restore(
    @Param('id', ParseIntPipe) id: Id,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Id>> {
    try {
      const user: Id = await this.itemService.restore(id);
      return res.status(HttpStatus.OK).json(user);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.KOGA_PART as string])
  @ApiOperation({ summary: 'Update Item' })
  @ApiResponse({
    status: 200,
    description: 'Item Update successfully.',
  })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @ApiParam({ name: 'id', description: 'Item ID', example: 1 })
  @ApiParam({
    name: 'type',
    description: 'Increase Or Decrease',
    example: 'increase',
  })
  @HttpCode(HttpStatus.OK)
  @Put('change_quantity/:id/:type/:addWay')
  @UsePipes(new ValidationPipe())
  async changeQuantity(
    @Param('id', ParseIntPipe) id: Id,
    @Param('type') type: 'increase' | 'decrease',
    @Param('addWay') addWay: 'cartoon' | 'single',

    @Body() body: ChangeItemQuantityDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Item>> {
    try {
      const item: Item = await this.itemService.changeQuantity(
        id,
        type,
        addWay,
        body,
        req['user'].id,
      );
      return res.status(HttpStatus.OK).json(item);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.KOGA_PART as string])
  @ApiOperation({ summary: 'Update Item' })
  @ApiResponse({
    status: 200,
    description: 'Item Update successfully.',
  })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @ApiParam({ name: 'id', description: 'Item ID', example: 1 })
  @HttpCode(HttpStatus.OK)
  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: Id,
    @Body() body: UpdateItemDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Item>> {
    try {
      const item: Item = await this.itemService.update(
        id,
        body,
        req['user'].id,
      );
      return res.status(HttpStatus.OK).json(item);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.KOGA_PART as string])
  @ApiOperation({ summary: 'Delete Item' })
  @ApiResponse({
    status: 200,
    description: 'Item Delete successfully.',
  })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @ApiParam({ name: 'id', description: 'Item ID', example: 1 })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: Id,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Id>> {
    try {
      const item: Id = await this.itemService.delete(id);
      return res.status(HttpStatus.OK).json(item);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
