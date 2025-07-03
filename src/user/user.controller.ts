import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  Param,
  Headers,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { Response } from 'express'; // ← こっちが型！

import { SignupDto } from 'src/user/dto/SignupDto';
import { UserService } from 'src/user/user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    try {
      console.log('Received signup request:', dto);
      if (!dto.user_id || !dto.password) {
        throw new BadRequestException({
          message: 'Account creation failed',
          cause: 'Required user_id and password',
        });
      }
      // 長さチェック
      if (
        dto.user_id.length < 6 ||
        dto.user_id.length > 20 ||
        dto.password.length < 8 ||
        dto.password.length > 20
      ) {
        throw new BadRequestException({
          message: 'Account creation failed',
          cause: 'Input length is incorrect',
        });
      }
      // 文字種チェック
      if (
        !/^[a-zA-Z0-9]+$/.test(dto.user_id) ||
        !/^[\x21-\x7E]+$/.test(dto.password)
      ) {
        throw new BadRequestException({
          message: 'Account creation failed',
          cause: 'Incorrect character pattern',
        });
      }
      console.log('Creating user with data:', dto);
      const user = await this.userService.signup(dto);

      return {
        message: 'Account successfully created',
        user: {
          user_id: user.nameid,
          nickname: user.nickname,
        },
      };
    } catch (e: any) {
      if (e instanceof BadRequestException) {
        throw e;
      }
      throw new BadRequestException({
        message: 'Account creation failed',
        cause: 'Already same user_id is used',
      });
    }
  }
  @Get('users/:user_id')
  async getUserById(
    @Param('user_id') user_id: string,
    @Headers('authorization') authHeader: string,
    @Res() res: Response,
  ) {
    try {
      if (!authHeader?.startsWith('Basic ')) {
        throw new UnauthorizedException();
      }

      const base64 = authHeader.split(' ')[1];
      const decoded = Buffer.from(base64, 'base64').toString('utf-8'); // user_id:password

      const [authUserId, password] = decoded.split(':');

      if (user_id !== authUserId) {
        throw new UnauthorizedException();
      }

      const user = await this.userService.findByCredentials(user_id, password);

      if (!user) {
        throw new BadRequestException();
      }

      const responseUser: any = {
        user_id: user.id,
        nickname: user.nickname,
      };

      if (user.comment) {
        responseUser.comment = user.comment;
      }

      return res.status(200).json({
        message: 'User details by user_id',
        user: responseUser,
      });
    } catch (e: any) {
      if (e instanceof UnauthorizedException) {
        return res.status(401).json({ message: 'Authentication failed' });
      }
      if (e instanceof BadRequestException) {
        return res.status(404).json({ message: 'Not user Found' });
      }
      return res.status(401).json({ message: 'Authentication failed' });
    }
  }
}
