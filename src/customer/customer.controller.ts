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
import { CustomerService } from './customer.service';
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
import { Customer } from 'database/types';
import { PartGuard } from 'src/auth/part.guard';
import { PartName } from 'src/auth/part.decorator';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ENUMs } from 'lib/enum';
import CreateCustomerDto from './dto/create-customer-dto';
import UpdateCustomerDto from './dto/update-customer-dto';

@UseGuards(AuthGuard, PartGuard)
@ApiTags('customer')
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}
  @PartName([ENUMs.CUSTOMERS_PART as string])
  @ApiOperation({ summary: 'Get All Customers' })
  @ApiResponse({
    status: 200,
    description: 'Customers retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Customers not found.' })
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
  ): Promise<Response<PaginationReturnType<Customer[]>>> {
    try {
      let customers: PaginationReturnType<Customer[]> =
        await this.customerService.getAll(page, limit, filter, from, to);
      return res.status(HttpStatus.OK).json(customers);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName(['all'])
  @ApiOperation({ summary: 'Get Select Customers' })
  @ApiResponse({
    status: 200,
    description: 'Customers retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Customers not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/select')
  async getSelect(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Customer[]>> {
    try {
      let customers: Customer[] = await this.customerService.getSelect();
      return res.status(HttpStatus.OK).json(customers);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CUSTOMERS_PART as string])
  @ApiOperation({ summary: 'Get All Deleted Customers' })
  @ApiResponse({
    status: 200,
    description: 'Deleted Customers retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Deleted Customers not found.' })
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
  ): Promise<Response<PaginationReturnType<Customer[]>>> {
    try {
      let customers: PaginationReturnType<Customer[]> =
        await this.customerService.getAllDeleted(page, limit, filter, from, to);
      return res.status(HttpStatus.OK).json(customers);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CUSTOMERS_PART as string])
  @ApiOperation({ summary: 'Search Customers' })
  @ApiResponse({
    status: 200,
    description: 'Customers retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Customers not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/search')
  async search(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Customer[]>> {
    try {
      let customers: Customer[] = await this.customerService.search(search);
      return res.status(HttpStatus.OK).json(customers);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CUSTOMERS_PART as string])
  @ApiOperation({ summary: 'Search Customers' })
  @ApiResponse({
    status: 200,
    description: 'Customers retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Customers not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/deleted_search')
  async deletedSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Customer[]>> {
    try {
      let customers: Customer[] =
        await this.customerService.deletedSearch(search);
      return res.status(HttpStatus.OK).json(customers);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CUSTOMERS_PART as string])
  @ApiOperation({ summary: 'Get Customer By Id' })
  @ApiParam({ name: 'id', description: 'Customer ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async getOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: Id,
  ): Promise<Response<Customer>> {
    try {
      let customer: Customer = await this.customerService.findOne(id);
      return res.status(HttpStatus.OK).json(customer);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CUSTOMERS_PART as string])
  @ApiOperation({ summary: 'Add Customer' })
  @ApiResponse({ status: 200, description: 'Customer created successfully.' })
  @HttpCode(HttpStatus.OK)
  @Post('')
  @UsePipes(new ValidationPipe())
  async create(
    @Body() body: CreateCustomerDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Customer>> {
    try {
      const customer: Customer = await this.customerService.create(
        body,
        req['user'].id,
      );
      return res.status(HttpStatus.OK).json(customer);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CUSTOMERS_PART as string])
  @ApiOperation({
    summary: 'Resotre Customer By Id (deleted flag in database)',
  })
  @ApiParam({ name: 'id', description: 'Customer ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @HttpCode(HttpStatus.OK)
  @Put('/restore/:id')
  async restore(
    @Param('id', ParseIntPipe) id: Id,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Id>> {
    try {
      const customer: Id = await this.customerService.restore(id);
      return res.status(HttpStatus.OK).json(customer);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CUSTOMERS_PART as string])
  @ApiOperation({ summary: 'Update Customer By Id' })
  @ApiParam({ name: 'id', description: 'Customer ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Customer Updated successfully.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @HttpCode(HttpStatus.OK)
  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: Id,
    @Body() body: UpdateCustomerDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Customer>> {
    try {
      const customer: Customer = await this.customerService.update(
        id,
        body,
        req['user'].id,
      );
      return res.status(HttpStatus.OK).json(customer);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CUSTOMERS_PART as string])
  @ApiOperation({ summary: 'Delete Customer By Id (restore flag in database)' })
  @ApiParam({ name: 'id', description: 'Customer ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Customer restore successfully.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: Id,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Id>> {
    try {
      const customer: Id = await this.customerService.delete(id);
      return res.status(HttpStatus.OK).json(customer);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
