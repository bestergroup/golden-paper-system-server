import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BackupService } from './backup.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { PartGuard } from 'src/auth/part.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PartName } from 'src/auth/part.decorator';
import { ENUMs } from 'lib/enum';
import { Request, Response } from 'express';
import {
  Filter,
  From,
  Limit,
  Page,
  PaginationReturnType,
  To,
} from 'src/types/global';
import {
  BackupWithUser,
  City,
  Config,
  Customer,
  DeptPay,
  Employee,
  Expense,
  Item,
  ItemQuantityHistory,
  Mandub,
  Printer,
  Role,
  Sell,
  SellItem,
  User,
} from 'database/types';

@UseGuards(AuthGuard, PartGuard)
@ApiTags('backup')
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}
  @PartName([ENUMs.NORMAL_BACKUP_PART as string])
  @ApiOperation({ summary: 'Backup All Users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Users not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/table_names')
  async getTableNames(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<string[]>> {
    try {
      let data: string[] = await this.backupService.getTableNames();
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.NORMAL_BACKUP_PART as string])
  @ApiOperation({ summary: 'Backup All Users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Users not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/all_table')
  async getAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('filter') filter: Filter,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<BackupWithUser[]>>> {
    try {
      let data: PaginationReturnType<BackupWithUser[]> =
        await this.backupService.getAll(page, limit, filter, from, to);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.NORMAL_BACKUP_PART as string])
  @ApiOperation({ summary: 'Backup All Users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Users not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/user')
  async backupUsers(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<User[]>> {
    try {
      let data: User[] = await this.backupService.backupUsers(req['user'].id);
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="users_backup.json"',
      );
      res.setHeader('Content-Type', 'application/json');
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.NORMAL_BACKUP_PART as string])
  @ApiOperation({ summary: 'Backup All Customers' })
  @ApiResponse({
    status: 200,
    description: 'Customers retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Customers not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/customer')
  async backupCustomers(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Customer[]>> {
    try {
      let data: Customer[] = await this.backupService.backupCustomers(
        req['user'].id,
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="customers_backup.json"',
      );
      res.setHeader('Content-Type', 'application/json');
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.NORMAL_BACKUP_PART as string])
  @ApiOperation({ summary: 'Backup All Mandubs' })
  @ApiResponse({
    status: 200,
    description: 'Mandubs retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Mandubs not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/mandub')
  async backupMandubs(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Mandub[]>> {
    try {
      let data: Mandub[] = await this.backupService.backupMandubs(
        req['user'].id,
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="mandubs_backup.json"',
      );
      res.setHeader('Content-Type', 'application/json');
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.NORMAL_BACKUP_PART as string])
  @ApiOperation({ summary: 'Backup All Employees' })
  @ApiResponse({
    status: 200,
    description: 'Employees retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Employees not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/employee')
  async backupEmployees(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Employee[]>> {
    try {
      let data: Employee[] = await this.backupService.backupEmployees(
        req['user'].id,
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="employees_backup.json"',
      );
      res.setHeader('Content-Type', 'application/json');
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.NORMAL_BACKUP_PART as string])
  @ApiOperation({ summary: 'Backup All Items' })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Items not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/item')
  async backupItems(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Item[]>> {
    try {
      let data: Item[] = await this.backupService.backupItems(req['user'].id);
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="items_backup.json"',
      );
      res.setHeader('Content-Type', 'application/json');
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.NORMAL_BACKUP_PART as string])
  @ApiOperation({ summary: 'Backup All Sells' })
  @ApiResponse({ status: 200, description: 'Sells retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Sells not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/sell')
  async backupSells(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Sell[]>> {
    try {
      let data: Sell[] = await this.backupService.backupSells(req['user'].id);
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="sells_backup.json"',
      );
      res.setHeader('Content-Type', 'application/json');
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.NORMAL_BACKUP_PART as string])
  @ApiOperation({ summary: 'Backup All SellItems' })
  @ApiResponse({
    status: 200,
    description: 'SellItems retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'SellItems not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/sell_item')
  async backupSellItems(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<SellItem[]>> {
    try {
      let data: SellItem[] = await this.backupService.backupSellItems(
        req['user'].id,
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="sell_items_backup.json"',
      );
      res.setHeader('Content-Type', 'application/json');
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.NORMAL_BACKUP_PART as string])
  @ApiOperation({ summary: 'Backup All Expenses' })
  @ApiResponse({ status: 200, description: 'Expenses retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Expenses not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/expense')
  async backupExpenses(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Expense[]>> {
    try {
      let data: Expense[] = await this.backupService.backupExpenses(
        req['user'].id,
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="expenses_backup.json"',
      );
      res.setHeader('Content-Type', 'application/json');
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.NORMAL_BACKUP_PART as string])
  @ApiOperation({ summary: 'Backup All Roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Roles not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/role')
  async backupRoles(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Role[]>> {
    try {
      let data: Role[] = await this.backupService.backupRoles(req['user'].id);
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="roles_backup.json"',
      );
      res.setHeader('Content-Type', 'application/json');
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.NORMAL_BACKUP_PART as string])
  @ApiOperation({ summary: 'Backup All Configs' })
  @ApiResponse({ status: 200, description: 'Configs retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Configs not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/config')
  async backupConfigs(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Config[]>> {
    try {
      let data: Config[] = await this.backupService.backupConfigs(
        req['user'].id,
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="configs_backup.json"',
      );
      res.setHeader('Content-Type', 'application/json');
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.NORMAL_BACKUP_PART as string])
  @ApiOperation({ summary: 'Backup All Cities' })
  @ApiResponse({ status: 200, description: 'Cities retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Cities not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/city')
  async backupCities(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<City[]>> {
    try {
      let data: City[] = await this.backupService.backupCities(req['user'].id);
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="cities_backup.json"',
      );
      res.setHeader('Content-Type', 'application/json');
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.NORMAL_BACKUP_PART as string])
  @ApiOperation({ summary: 'Backup All DeptPays' })
  @ApiResponse({ status: 200, description: 'DeptPays retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'DeptPays not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/dept_pay')
  async backupDeptPays(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<DeptPay[]>> {
    try {
      let data: DeptPay[] = await this.backupService.backupDeptPays(
        req['user'].id,
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="dept_pays_backup.json"',
      );
      res.setHeader('Content-Type', 'application/json');
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.NORMAL_BACKUP_PART as string])
  @ApiOperation({ summary: 'Backup All Printers' })
  @ApiResponse({ status: 200, description: 'Printers retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Printers not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/printer')
  async backupPrinters(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Printer[]>> {
    try {
      let data: Printer[] = await this.backupService.backupPrinters(
        req['user'].id,
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="printers_backup.json"',
      );
      res.setHeader('Content-Type', 'application/json');
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.NORMAL_BACKUP_PART as string])
  @ApiOperation({ summary: 'Backup All ItemQuantityHistories' })
  @ApiResponse({
    status: 200,
    description: 'ItemQuantityHistories retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'ItemQuantityHistories not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/item_quantity_history')
  async backupItemQuantityHistories(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<ItemQuantityHistory[]>> {
    try {
      let data: ItemQuantityHistory[] =
        await this.backupService.backupItemQuantityHistories(req['user'].id);
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="item_quantity_histories_backup.json"',
      );
      res.setHeader('Content-Type', 'application/json');
      return res.status(HttpStatus.OK).send(JSON.stringify(data, null, 2));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
