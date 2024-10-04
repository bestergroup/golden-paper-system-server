import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CaseService } from './case.service';
import { Request, Response } from 'express';
import { Case, CaseHistory } from 'database/types';
import {
  From,
  Limit,
  Page,
  PaginationReturnType,
  Search,
  To,
} from 'src/types/global';
import { CaseChart } from 'src/types/case';
import { AuthGuard } from 'src/auth/auth.guard';
import { PartGuard } from 'src/auth/part.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PartName } from 'src/auth/part.decorator';
import { ENUMs } from 'lib/enum';
import UpdateCaseDto from './dto/update-case.dto';

@UseGuards(AuthGuard, PartGuard)
@ApiTags('case')
@Controller('case')
export class CaseController {
  constructor(private readonly caseService: CaseService) {}
  @PartName([ENUMs.CASE_PART as string])
  @ApiOperation({ summary: 'Get All Cases' })
  @ApiResponse({ status: 200, description: 'Cases retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Cases not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('')
  async get(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Case | null>> {
    try {
      let theCase: Case = await this.caseService.get();
      return res.status(HttpStatus.OK).json(theCase);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CASE_PART as string])
  @ApiOperation({ summary: 'Update All Cases' })
  @ApiResponse({ status: 200, description: 'Cases retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Cases not found.' })
  @HttpCode(HttpStatus.OK)
  @Put('/:type')
  async updateCase(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: UpdateCaseDto,
    @Param('type') type: 'increase' | 'decrease',
  ): Promise<Response<Case | null>> {
    try {
      let theCase: Case = await this.caseService.updateCase(data, type);
      return res.status(HttpStatus.OK).json(theCase);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CASE_PART as string])
  @ApiOperation({ summary: 'Get All History' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'History not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('history')
  async getHistory(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<CaseHistory[]> | null>> {
    try {
      let histories: PaginationReturnType<CaseHistory[]> =
        await this.caseService.getHistories(page, limit, from, to);
      return res.status(HttpStatus.OK).json(histories);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CUSTOMERS_PART as string])
  @ApiOperation({ summary: 'Search CaseHistories' })
  @ApiResponse({
    status: 200,
    description: 'CaseHistories retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'CaseHistories not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('/history/search')
  async search(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<CaseHistory[]>> {
    try {
      let history: CaseHistory[] = await this.caseService.search(search);
      return res.status(HttpStatus.OK).json(history);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @PartName([ENUMs.CASE_PART as string])
  @ApiOperation({ summary: 'Get All Charts' })
  @ApiResponse({ status: 200, description: 'Charts retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Charts not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('chart')
  async getChart(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<CaseChart[] | null>> {
    try {
      let chart: CaseChart[] = await this.caseService.getChart();
      return res.status(HttpStatus.OK).json(chart);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
