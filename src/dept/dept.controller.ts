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
  To,
} from 'src/types/global';
import { Response } from 'express';
import { DeptPay } from 'database/types';

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
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('userFilter') userFilter: Filter,
    @Query('from') from: From,
    @Query('to') to: To,
    @Param('sell_id', ParseIntPipe) sell_id: Id,
  ): Promise<Response<PaginationReturnType<DeptPay[]>>> {
    try {
      let sellDeptPays: PaginationReturnType<DeptPay[]> =
        await this.deptService.getAll(
          page,
          limit,
          userFilter,
          from,
          to,
          sell_id,
        );
      return res.status(HttpStatus.OK).json(sellDeptPays);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
