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
import { EmployeeService } from './employee.service';
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
import { Employee } from 'database/types';
import { PartGuard } from 'src/auth/part.guard';
import { PartName } from 'src/auth/part.decorator';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ENUMs } from 'lib/enum';
import CreateEmployeeDto from './dto/create-employee-dto';
import UpdateEmployeeDto from './dto/update-employee-dto';

@UseGuards(AuthGuard, PartGuard)
@ApiTags('employee')
@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}
  @PartName([ENUMs.EMPLOYEES_PART as string])
  @ApiOperation({ summary: 'Get All Employees' })
  @ApiResponse({
    status: 200,
    description: 'Employees retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Employees not found.' })
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
  ): Promise<Response<PaginationReturnType<Employee[]>>> {
    try {
      let employees: PaginationReturnType<Employee[]> =
        await this.employeeService.getAll(page, limit, filter, from, to);
      return res.status(HttpStatus.OK).json(employees);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName(['all'])
  @ApiOperation({ summary: 'Get Select Employees' })
  @ApiResponse({
    status: 200,
    description: 'Employees retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Employees not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/select')
  async getSelect(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Employee[]>> {
    try {
      let employees: Employee[] = await this.employeeService.getSelect();
      return res.status(HttpStatus.OK).json(employees);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.EMPLOYEES_PART as string])
  @ApiOperation({ summary: 'Get All Deleted Employees' })
  @ApiResponse({
    status: 200,
    description: 'Deleted Employees retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Deleted Employees not found.' })
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
  ): Promise<Response<PaginationReturnType<Employee[]>>> {
    try {
      let employees: PaginationReturnType<Employee[]> =
        await this.employeeService.getAllDeleted(page, limit, filter, from, to);
      return res.status(HttpStatus.OK).json(employees);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.EMPLOYEES_PART as string])
  @ApiOperation({ summary: 'Search Employees' })
  @ApiResponse({
    status: 200,
    description: 'Employees retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Employees not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/search')
  async search(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Employee[]>> {
    try {
      let employees: Employee[] = await this.employeeService.search(search);
      return res.status(HttpStatus.OK).json(employees);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.EMPLOYEES_PART as string])
  @ApiOperation({ summary: 'Search Employees' })
  @ApiResponse({
    status: 200,
    description: 'Employees retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Employees not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/deleted_search')
  async deletedSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Employee[]>> {
    try {
      let employees: Employee[] =
        await this.employeeService.deletedSearch(search);
      return res.status(HttpStatus.OK).json(employees);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.EMPLOYEES_PART as string])
  @ApiOperation({ summary: 'Get Employee By Id' })
  @ApiParam({ name: 'id', description: 'Employee ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Employee retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async getOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: Id,
  ): Promise<Response<Employee>> {
    try {
      let employee: Employee = await this.employeeService.findOne(id);
      return res.status(HttpStatus.OK).json(employee);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.EMPLOYEES_PART as string])
  @ApiOperation({ summary: 'Add Employee' })
  @ApiResponse({ status: 200, description: 'Employee created successfully.' })
  @HttpCode(HttpStatus.OK)
  @Post('')
  @UsePipes(new ValidationPipe())
  async create(
    @Body() body: CreateEmployeeDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Employee>> {
    try {
      const employee: Employee = await this.employeeService.create(
        body,
        req['user'].id,
      );
      return res.status(HttpStatus.OK).json(employee);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.EMPLOYEES_PART as string])
  @ApiOperation({
    summary: 'Resotre Employee By Id (deleted flag in database)',
  })
  @ApiParam({ name: 'id', description: 'Employee ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Employee deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  @HttpCode(HttpStatus.OK)
  @Put('/restore/:id')
  async restore(
    @Param('id', ParseIntPipe) id: Id,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Id>> {
    try {
      const employee: Id = await this.employeeService.restore(id);
      return res.status(HttpStatus.OK).json(employee);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.EMPLOYEES_PART as string])
  @ApiOperation({ summary: 'Update Employee By Id' })
  @ApiParam({ name: 'id', description: 'Employee ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Employee Updated successfully.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  @HttpCode(HttpStatus.OK)
  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: Id,
    @Body() body: UpdateEmployeeDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Employee>> {
    try {
      const employee: Employee = await this.employeeService.update(
        id,
        body,
        req['user'].id,
      );
      return res.status(HttpStatus.OK).json(employee);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.EMPLOYEES_PART as string])
  @ApiOperation({ summary: 'Delete Employee By Id (restore flag in database)' })
  @ApiParam({ name: 'id', description: 'Employee ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Employee restore successfully.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: Id,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Id>> {
    try {
      const employee: Id = await this.employeeService.delete(id);
      return res.status(HttpStatus.OK).json(employee);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
