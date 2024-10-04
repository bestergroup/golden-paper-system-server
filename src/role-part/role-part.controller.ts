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
import { RolePartService } from './role-part.service';
import { Request, Response } from 'express';
import { RolePart } from 'database/types';
import { RoleWithPartJoin } from 'src/types/role-part';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PartGuard } from 'src/auth/part.guard';
import { PartName } from 'src/auth/part.decorator';

@UseGuards(AuthGuard, PartGuard)
@ApiTags('role-part')
@Controller('role-part')
export class RolePartController {
  constructor(private readonly rolePartService: RolePartService) {}
  @PartName(['ڕۆڵەکان', 'بەکارهێنەران'])
  @ApiOperation({ summary: 'Get Role Parts' })
  @ApiResponse({
    status: 200,
    description: 'Role Parts retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Role Parts not found.' })
  @HttpCode(HttpStatus.OK)
  @Get('role/:id')
  async getRoleParts(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Response<RolePart[]>> {
    try {
      let roleParts: RoleWithPartJoin[] =
        await this.rolePartService.findRoleParts(id);
      return res.status(HttpStatus.OK).json(roleParts);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
