import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { DeptService } from './dept.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { PartGuard } from 'src/auth/part.guard';
import { PartName } from 'src/auth/part.decorator';
import { ENUMs } from 'lib/enum';
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
import { Response } from 'express';
import { DeptPay, Sell } from 'database/types';

@UseGuards(AuthGuard, PartGuard)
@ApiTags('dept')
@Controller('dept')
export class DeptController {
  constructor(private readonly deptService: DeptService) {}
  @PartName([ENUMs.SELL_PART as string])
  @ApiOperation({ summary: 'Get All Sells' })
  @ApiResponse({ status: 200, description: 'Sells retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Sells not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('sell_dept_pays/:sell_id')
  async getSellDeptPays(
    @Req() req: Request,
    @Res() res: Response,

    @Param('sell_id', ParseIntPipe) sell_id: Id,
  ): Promise<Response<DeptPay[]>> {
    try {
      let sellDeptPays: DeptPay[] =
        await this.deptService.getSellDeptPays(sell_id);
      return res.status(HttpStatus.OK).json(sellDeptPays);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

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
      let sells: PaginationReturnType<Sell[]> = await this.deptService.getAll(
        page,
        limit,
        userFilter,
        from,
        to,
      );
      return res.status(HttpStatus.OK).json(sells);
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
      let sells: Sell[] = await this.deptService.search(search);
      return res.status(HttpStatus.OK).json(sells);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
