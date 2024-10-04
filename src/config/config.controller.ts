import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from './config.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { PartGuard } from 'src/auth/part.guard';
import { PartName } from 'src/auth/part.decorator';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Config } from 'database/types';
import { UpdateConfigDto } from './dto/update-config-dto';
import { ENUMs } from 'lib/enum';

@UseGuards(AuthGuard, PartGuard)
@ApiTags('config')
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @PartName([ENUMs.CONFIG_PART as string, ENUMs.LESS_ITEM_PART as string])
  @ApiOperation({ summary: 'Get All Configs' })
  @ApiResponse({ status: 200, description: 'Configs retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Configs not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('')
  async getAll(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Config>> {
    try {
      let config: Config = await this.configService.getAll();
      return res.status(HttpStatus.OK).json(config);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @PartName([ENUMs.CONFIG_PART as string])
  @ApiOperation({ summary: 'Update Config By Id' })
  @ApiParam({ name: 'id', description: 'Config ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Config Updated successfully.' })
  @ApiResponse({ status: 404, description: 'Config not found.' })
  @HttpCode(HttpStatus.OK)
  @Put(':key')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('key') key: string,
    @Body() body: UpdateConfigDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<Config>> {
    try {
      const config: Config = await this.configService.update(key, body);
      return res.status(HttpStatus.OK).json(config);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
