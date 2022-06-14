import { Controller, Get, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorators';
import { JwtGuard } from './../auth/guard/';

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  @Get('/profile')
  getUserProfile(@GetUser() user: User) {
    return user;
  }
}
