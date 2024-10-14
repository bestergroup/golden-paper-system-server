import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserPartService } from './user-part.service';
import { Request, Response } from 'express';
import { UserPart } from 'database/types';
import { UserPartWithPartJoin } from 'src/types/user-part';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PartGuard } from 'src/auth/part.guard';
import { PartName } from 'src/auth/part.decorator';
import { ENUMs } from 'lib/enum';

@UseGuards(AuthGuard, PartGuard)
@ApiTags('user-part')
@Controller('user-part')
export class UserPartController {
  constructor(private readonly userPartService: UserPartService) {}
  @PartName([ENUMs.USERS_PART as string])
  @ApiOperation({ summary: 'Get User Parts' })
  @ApiResponse({
    status: 200,
    description: 'User Parts retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'User Parts not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('user/:id')
  async getUserParts(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Response<UserPart[]>> {
    try {
      let userParts: UserPartWithPartJoin[] =
        await this.userPartService.findUserParts(id);
      return res.status(HttpStatus.OK).json(userParts);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
