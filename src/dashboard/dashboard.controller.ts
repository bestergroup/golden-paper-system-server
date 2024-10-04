import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PartGuard } from 'src/auth/part.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ENUMs } from 'lib/enum';
import { PartName } from 'src/auth/part.decorator';
import { Request, Response } from 'express';

@UseGuards(AuthGuard, PartGuard)
@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @PartName([ENUMs.DASHBOARD_PART as string])
  @ApiOperation({ summary: 'Get All Users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Users not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('')
  async getAll(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<any>> {
    try {
      let dashboards: any = await this.dashboardService.get();
      return res.status(HttpStatus.OK).json(dashboards);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
