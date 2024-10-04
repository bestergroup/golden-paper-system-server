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
import { ReportService } from './report.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { PartGuard } from 'src/auth/part.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PartName } from 'src/auth/part.decorator';
import { ENUMs } from 'lib/enum';
import { Request, Response } from 'express';
import {
  CaseReport,
  Filter,
  From,
  Limit,
  Page,
  PaginationReturnType,
  Search,
  To,
} from 'src/types/global';
import {
  Expense,
  Item,
  ItemQuantityHistory,
  Sell,
  SellItem,
} from 'database/types';

@UseGuards(AuthGuard, PartGuard)
@ApiTags('report')
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}
  //SELL REPORT
  @PartName([ENUMs.SELL_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Sell' })
  @ApiResponse({ status: 200, description: 'Sell retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Sell not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('sell')
  async getSell(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<Sell[]>>> {
    try {
      let data: PaginationReturnType<Sell[]> = await this.reportService.getSell(
        page,
        limit,
        from,
        to,
      );
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.SELL_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Sell' })
  @ApiResponse({ status: 200, description: 'Sell retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Sell not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('sell/information')
  async getSellInformation(
    @Req() req: Request,
    @Res() res: Response,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<any>> {
    try {
      let data: any = await this.reportService.getSellInformation(from, to);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.SELL_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Sell' })
  @ApiResponse({ status: 200, description: 'Sell retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Sell not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('sell_search')
  async getSellSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Sell[]>> {
    try {
      let data: Sell[] = await this.reportService.getSellSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.SELL_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Sell' })
  @ApiResponse({ status: 200, description: 'Sell retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Sell not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('sell_search/information')
  async getSellInformationSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<any>> {
    try {
      let data: any = await this.reportService.getSellInformationSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.SELL_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Sell' })
  @ApiResponse({ status: 200, description: 'Sell retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Sell not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('sell/print')
  async sellPrint(
    @Req() req: Request,
    @Res() res: Response,
    @Query('from') from: From,
    @Query('to') to: To,
    @Query('search') search: Search,
  ): Promise<Response<void>> {
    try {
      await this.reportService.sellPrint(search, from, to, res);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  //ITEM REPORT

  @PartName([ENUMs.SELL_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('item')
  async getItem(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<SellItem[]>>> {
    try {
      let data: PaginationReturnType<SellItem[]> =
        await this.reportService.getItem(page, limit, from, to);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.SELL_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('item/information')
  async getItemInformation(
    @Req() req: Request,
    @Res() res: Response,

    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<any>> {
    try {
      let data: any = await this.reportService.getItemInformation(from, to);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.SELL_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('item_search')
  async getItemSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<SellItem[]>> {
    try {
      let data: SellItem[] = await this.reportService.getItemSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.SELL_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('item_search/information')
  async getItemInformationSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<any>> {
    try {
      let data: any = await this.reportService.getItemInformationSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.SELL_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('item/print')
  async itemPrint(
    @Req() req: Request,
    @Res() res: Response,
    @Query('from') from: From,
    @Query('to') to: To,
    @Query('search') search: Search,
  ): Promise<Response<void>> {
    try {
      await this.reportService.itemPrint(search, from, to, res);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  //KOGA ALL REPORT

  @PartName([ENUMs.KOGA_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('koga_all')
  async getKogaAll(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
  ): Promise<Response<PaginationReturnType<Item[]>>> {
    try {
      let data: PaginationReturnType<Item[]> =
        await this.reportService.getKogaAll(page, limit);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.KOGA_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('koga_all/information')
  async getKogaAllInformation(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<any>> {
    try {
      let data: any = await this.reportService.getKogaAllInformation();
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  //test
  @PartName([ENUMs.KOGA_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('koga_all_search')
  async getKogaAllSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Item[]>> {
    try {
      let data: Item[] = await this.reportService.getKogaAllSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.KOGA_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('koga_all_search/information')
  async getKogaAllInformationSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<any>> {
    try {
      let data: any =
        await this.reportService.getKogaAllInformationSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.KOGA_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('koga_all/print')
  async kogaAllPrint(
    @Req() req: Request,
    @Res() res: Response,

    @Query('search') search: Search,
  ): Promise<Response<void>> {
    try {
      await this.reportService.kogaAllPrint(search, res);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  //KOGA NULL REPORT

  @PartName([ENUMs.KOGA_REPORT_PART as string])
  @ApiOperation({ summary: 'Get Null Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('koga_null')
  async getKogaNull(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
  ): Promise<Response<PaginationReturnType<Item[]>>> {
    try {
      let data: PaginationReturnType<Item[]> =
        await this.reportService.getKogaNull(page, limit);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.KOGA_REPORT_PART as string])
  @ApiOperation({ summary: 'Get Null Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('koga_null/information')
  async getKogaNullInformation(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<any>> {
    try {
      let data: any = await this.reportService.getKogaNullInformation();
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  //test
  @PartName([ENUMs.KOGA_REPORT_PART as string])
  @ApiOperation({ summary: 'Get Null Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('koga_null_search')
  async getKogaNullSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Item[]>> {
    try {
      let data: Item[] = await this.reportService.getKogaNullSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.KOGA_REPORT_PART as string])
  @ApiOperation({ summary: 'Get Null Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('koga_null_search/information')
  async getKogaNullInformationSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<any>> {
    try {
      let data: any =
        await this.reportService.getKogaNullInformationSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.KOGA_REPORT_PART as string])
  @ApiOperation({ summary: 'Get Null Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('koga_null/print')
  async kogaNullPrint(
    @Req() req: Request,
    @Res() res: Response,
    @Query('filter') filter: Filter,

    @Query('search') search: Search,
  ): Promise<Response<void>> {
    try {
      await this.reportService.kogaNullPrint(search, filter, res);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  //KOGA MOVEMENT REPORT

  @PartName([ENUMs.KOGA_REPORT_PART as string])
  @ApiOperation({ summary: 'Get Movement Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('koga_movement')
  async getKogaMovement(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,

    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<ItemQuantityHistory[]>>> {
    try {
      let data: PaginationReturnType<ItemQuantityHistory[]> =
        await this.reportService.getKogaMovement(page, limit, from, to);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.KOGA_REPORT_PART as string])
  @ApiOperation({ summary: 'Get Movement Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('koga_movement/information')
  async getKogaMovementInformation(
    @Req() req: Request,
    @Res() res: Response,

    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<any>> {
    try {
      let data: any = await this.reportService.getKogaMovementInformation(
        from,
        to,
      );
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  //test
  @PartName([ENUMs.KOGA_REPORT_PART as string])
  @ApiOperation({ summary: 'Get Movement Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('koga_movement_search')
  async getKogaMovementSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<ItemQuantityHistory[]>> {
    try {
      let data: ItemQuantityHistory[] =
        await this.reportService.getKogaMovementSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.KOGA_REPORT_PART as string])
  @ApiOperation({ summary: 'Get Movement Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('koga_movement_search/information')
  async getKogaMovementInformationSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<any>> {
    try {
      let data: any =
        await this.reportService.getKogaMovementInformationSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.KOGA_REPORT_PART as string])
  @ApiOperation({ summary: 'Get Movement Item' })
  @ApiResponse({ status: 200, description: 'Item retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('koga_movement/print')
  async kogaMovementPrint(
    @Req() req: Request,
    @Res() res: Response,

    @Query('from') from: From,
    @Query('to') to: To,
    @Query('search') search: Search,
  ): Promise<Response<void>> {
    try {
      await this.reportService.kogaMovementPrint(search, from, to, res);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  //BILL PROFIT REPORT
  @PartName([ENUMs.PROFIT_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All BillProfit' })
  @ApiResponse({
    status: 200,
    description: 'BillProfit retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'BillProfit not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('bill_profit')
  async getBillProfit(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<Sell[]>>> {
    try {
      let data: PaginationReturnType<Sell[]> =
        await this.reportService.getBillProfit(page, limit, from, to);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.PROFIT_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All BillProfit' })
  @ApiResponse({
    status: 200,
    description: 'BillProfit retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'BillProfit not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('bill_profit/information')
  async getBillProfitInformation(
    @Req() req: Request,
    @Res() res: Response,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<any>> {
    try {
      let data: any = await this.reportService.getBillProfitInformation(
        from,
        to,
      );
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.PROFIT_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All BillProfit' })
  @ApiResponse({
    status: 200,
    description: 'BillProfit retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'BillProfit not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('bill_profit_search')
  async getBillProfitSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Sell[]>> {
    try {
      let data: Sell[] = await this.reportService.getBillProfitSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.PROFIT_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All BillProfit' })
  @ApiResponse({
    status: 200,
    description: 'BillProfit retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'BillProfit not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('bill_profit_search/information')
  async getBillProfitInformationSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<any>> {
    try {
      let data: any =
        await this.reportService.getBillProfitInformationSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.PROFIT_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All BillProfit' })
  @ApiResponse({
    status: 200,
    description: 'BillProfit retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'BillProfit not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('bill_profit/print')
  async BillProfitPrint(
    @Req() req: Request,
    @Res() res: Response,
    @Query('from') from: From,
    @Query('to') to: To,
    @Query('search') search: Search,
  ): Promise<Response<void>> {
    try {
      await this.reportService.billProfitPrint(search, from, to, res);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  //ITEM_PROFIT

  @PartName([ENUMs.PROFIT_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All ItemProfit' })
  @ApiResponse({
    status: 200,
    description: 'ItemProfit retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'ItemProfit not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('item_profit')
  async getItemProfit(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<SellItem[]>>> {
    try {
      let data: PaginationReturnType<SellItem[]> =
        await this.reportService.getItemProfit(page, limit, from, to);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.PROFIT_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All ItemProfit' })
  @ApiResponse({
    status: 200,
    description: 'ItemProfit retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'ItemProfit not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('item_profit/information')
  async getItemProfitInformation(
    @Req() req: Request,
    @Res() res: Response,

    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<any>> {
    try {
      let data: any = await this.reportService.getItemProfitInformation(
        from,
        to,
      );
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.PROFIT_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All ItemProfit' })
  @ApiResponse({
    status: 200,
    description: 'ItemProfit retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'ItemProfit not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('item_profit_search')
  async getItemProfitSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<SellItem[]>> {
    try {
      let data: SellItem[] =
        await this.reportService.getItemProfitSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.PROFIT_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All ItemProfit' })
  @ApiResponse({
    status: 200,
    description: 'ItemProfit retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'ItemProfit not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('item_profit_search/information')
  async getItemProfitInformationSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<any>> {
    try {
      let data: any =
        await this.reportService.getItemProfitInformationSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.PROFIT_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All ItemProfit' })
  @ApiResponse({
    status: 200,
    description: 'ItemProfit retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'ItemProfit not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('item_profit/print')
  async itemProfitPrint(
    @Req() req: Request,
    @Res() res: Response,
    @Query('from') from: From,
    @Query('to') to: To,
    @Query('search') search: Search,
  ): Promise<Response<void>> {
    try {
      await this.reportService.itemProfitPrint(search, from, to, res);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  //EXPENSE REPORT

  @PartName([ENUMs.EXPENSE_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Expense' })
  @ApiResponse({ status: 200, description: 'Expense retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('expense')
  async getExpense(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<Expense[]>>> {
    try {
      let data: PaginationReturnType<Expense[]> =
        await this.reportService.getExpense(page, limit, from, to);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.EXPENSE_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Expense' })
  @ApiResponse({ status: 200, description: 'Expense retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('expense/information')
  async getExpenseInformation(
    @Req() req: Request,
    @Res() res: Response,

    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<any>> {
    try {
      let data: any = await this.reportService.getExpenseInformation(from, to);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.EXPENSE_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Expense' })
  @ApiResponse({ status: 200, description: 'Expense retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('expense_search')
  async getExpenseSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<Expense[]>> {
    try {
      let data: Expense[] = await this.reportService.getExpenseSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.EXPENSE_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Expense' })
  @ApiResponse({ status: 200, description: 'Expense retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('expense_search/information')
  async getExpenseInformationSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<any>> {
    try {
      let data: any =
        await this.reportService.getExpenseInformationSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.EXPENSE_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Expense' })
  @ApiResponse({ status: 200, description: 'Expense retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('expense/print')
  async expensePrint(
    @Req() req: Request,
    @Res() res: Response,
    @Query('from') from: From,
    @Query('filter') filter: Filter,
    @Query('to') to: To,
    @Query('search') search: Search,
  ): Promise<Response<void>> {
    try {
      await this.reportService.expensePrint(filter, search, from, to, res);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  //CASE REPORT
  @PartName([ENUMs.CASE_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Case' })
  @ApiResponse({ status: 200, description: 'Case retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Case not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('case')
  async getCase(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: Page,
    @Query('limit') limit: Limit,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<PaginationReturnType<CaseReport[]>>> {
    try {
      let data: PaginationReturnType<CaseReport[]> =
        await this.reportService.getCase(page, limit, from, to);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.CASE_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Case' })
  @ApiResponse({ status: 200, description: 'Case retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Case not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('case/information')
  async getCaseInformation(
    @Req() req: Request,
    @Res() res: Response,
    @Query('from') from: From,
    @Query('to') to: To,
  ): Promise<Response<any>> {
    try {
      let data: any = await this.reportService.getCaseInformation(from, to);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.CASE_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Case' })
  @ApiResponse({ status: 200, description: 'Case retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Case not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('case_search')
  async getCaseSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<CaseReport[]>> {
    try {
      let data: CaseReport[] = await this.reportService.getCaseSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.CASE_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Case' })
  @ApiResponse({ status: 200, description: 'Case retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Case not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('case_search/information')
  async getCaseInformationSearch(
    @Req() req: Request,
    @Res() res: Response,
    @Query('search') search: Search,
  ): Promise<Response<any>> {
    try {
      let data: any = await this.reportService.getCaseInformationSearch(search);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.CASE_REPORT_PART as string])
  @ApiOperation({ summary: 'Get All Case' })
  @ApiResponse({ status: 200, description: 'Case retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Case not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('case/print')
  async casePrint(
    @Req() req: Request,
    @Res() res: Response,
    @Query('from') from: From,
    @Query('to') to: To,
    @Query('search') search: Search,
  ): Promise<Response<void>> {
    try {
      await this.reportService.sellPrint(search, from, to, res);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
