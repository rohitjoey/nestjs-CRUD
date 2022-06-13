import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon from 'argon2';
import { PrismaService } from './../prisma/prisma.service';
import { AuthDto } from './dto';

@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async login(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new ForbiddenException('Wrong Credentials');

    const isValidPassword = await argon.verify(user.password, dto.password);
    if (!isValidPassword) throw new ForbiddenException('Wrong Credentials');

    delete user.password;

    return user;
  }

  async signUp(dto: AuthDto) {
    // console.log(dto);
    try {
      const hashedPassword = await argon.hash(dto.password);
      const user = await this.prisma.user.create({
        data: { email: dto.email, password: hashedPassword },
      });
      delete user.password;
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email already taken');
        }
      }
      throw error;
    }
  }

  async getUsers() {
    const users = await this.prisma.user.findMany();
    return users;
  }
}
