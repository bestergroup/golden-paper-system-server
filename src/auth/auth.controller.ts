import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import SignInDto from './dto/sign-in.dto';
import { AuthGuard } from './auth.guard';
import { LoginQ, UserWithRoleAndPart } from 'src/types/auth';
import { CurrentUserGuard } from './current-user.guard';
import ChangeProfileDto from './dto/change-profile.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Sign in' })
  @ApiResponse({ status: 200, description: 'You Signed in successfully' })
  @ApiResponse({ status: 404, description: 'User Not Found' })
  @Post('login')
  async signIn(
    @Body() body: SignInDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<LoginQ>> {
    try {
      const data: LoginQ = await this.authService.signIn(
        body.username,
        body.password,
      );

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Auth Data' })
  @ApiResponse({ status: 200, description: 'Auth Data Get successfully' })
  @ApiResponse({ status: 404, description: 'User Not Found' })
  @Get()
  async getAuth(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<UserWithRoleAndPart | null>> {
    try {
      let user: UserWithRoleAndPart = await this.authService.getAuth(
        req['user'].id,
      );
      return res.status(HttpStatus.OK).json(user);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, CurrentUserGuard)
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Change Auth' })
  @ApiResponse({ status: 200, description: 'Auth Changed successfully' })
  @ApiResponse({ status: 404, description: 'User Not Found' })
  @Post('change_profile')
  async changeProfile(
    @Body() body: ChangeProfileDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<UserWithRoleAndPart | null>> {
    try {
      let data: UserWithRoleAndPart = await this.authService.changeProfile(
        req['user'].id,
        body,
      );
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  }
}
