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
import { ExpenseService } from './expense.service';
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
import { CreateExpenseDto } from './dto/create-expense-dto';
import { UpdateExpenseDto } from './dto/update-expense-dto';
import { Expense } from 'database/types';

@UseGuards(AuthGuard, PartGuard)
@ApiTags('expense')
@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}
  @PartName([ENUMs.EXPENSES_PART as string])
  @ApiOperation({ summary: 'Get All Expenses' })
  @ApiResponse({ status: 200, description: 'Expenses retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Expenses not found.' })
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
  ): Promise<Response<PaginationReturnType<Expense[]>>> {
    try {
      let expenses: PaginationReturnType<Expense[]> =
        await this.expenseService.getAll(
          page,
          limit,
          filter,
          from,
          to,
          userFilter,
        );
      return res.status(HttpStatus.OK).json(expenses);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.EXPENSES_PART as string])
  @ApiOperation({ summary: 'Get All Deleted Expenses' })
  @ApiResponse({
    status: 200,
    description: 'Deleted Expenses retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Deleted Expenses not found.' })
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
  ): Promise<Response<PaginationReturnType<Expense[]>>> {
    try {
      let expenses: PaginationReturnType<Expense[]> =
        await this.expenseService.getAllDeleted(
          page,
          limit,
          filter,
          from,
          to,
          userFilter,
        );
      return res.status(HttpStatus.OK).json(expenses);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.EXPENSES_PART as string])
  @ApiOperation({ summary: 'Get Expense By Id' })
  @ApiParam({ name: 'id', description: 'Expense ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Expense retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async getOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: Id,
  ): Promise<Response<Expense>> {
    try {
      let expense: Expense = await this.expenseService.findOne(id);
      return res.status(HttpStatus.OK).json(expense);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.USERS_PART as string])
  @ApiOperation({ summary: 'Search Expense' })
  @ApiResponse({ status: 200, description: 'Expense retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/deleted_search')
  async deletedSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Expense[]>> {
    try {
      let users: Expense[] = await this.expenseService.deletedSearch(search);
      return res.status(HttpStatus.OK).json(users);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.EXPENSES_PART as string])
  @ApiOperation({ summary: 'Add Expense' })
  @ApiResponse({ status: 200, description: 'Expense created successfully.' })
  @HttpCode(HttpStatus.OK)
  @Post('')
  @UsePipes(new ValidationPipe())
  async create(
    @Body() body: CreateExpenseDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Expense>> {
    try {
      const expense: Expense = await this.expenseService.create(
        body,
        req['user'].id,
      );
      return res.status(HttpStatus.OK).json(expense);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.EXPENSES_PART as string])
  @ApiOperation({ summary: 'Resotre Expense By Id (deleted flag in database)' })
  @ApiParam({ name: 'id', description: 'Expense ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  @HttpCode(HttpStatus.OK)
  @Put('/restore/:id')
  async restore(
    @Param('id', ParseIntPipe) id: Id,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Id>> {
    try {
      const expense: Id = await this.expenseService.restore(id);
      return res.status(HttpStatus.OK).json(expense);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.EXPENSES_PART as string])
  @ApiOperation({ summary: 'Update Expense By Id' })
  @ApiParam({ name: 'id', description: 'Expense ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Expense Updated successfully.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  @HttpCode(HttpStatus.OK)
  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: Id,
    @Body() body: UpdateExpenseDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Expense>> {
    try {
      const expense: Expense = await this.expenseService.update(
        id,
        body,
        req['user'].id,
      );
      return res.status(HttpStatus.OK).json(expense);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.EXPENSES_PART as string])
  @ApiOperation({ summary: 'Delete Expense By Id (restore flag in database)' })
  @ApiParam({ name: 'id', description: 'Expense ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Expense restore successfully.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: Id,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Id>> {
    try {
      const expense: Id = await this.expenseService.delete(id);
      return res.status(HttpStatus.OK).json(expense);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
