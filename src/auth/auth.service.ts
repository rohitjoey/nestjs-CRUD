import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon from 'argon2';
import { PrismaService } from './../prisma/prisma.service';
import { AuthDto } from './dto';

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: AuthDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) throw new ForbiddenException('Wrong Credentials');

      const isValidPassword = await argon.verify(user.password, dto.password);
      if (!isValidPassword) throw new ForbiddenException('Wrong Credentials');

      return this.generateJwt(user.id);
    } catch (error) {
      throw error;
    }
  }

  async signUp(dto: AuthDto) {
    // console.log(dto);
    try {
      const hashedPassword = await argon.hash(dto.password);
      const user = await this.prisma.user.create({
        data: { email: dto.email, password: hashedPassword },
      });
      return this.generateJwt(user.id);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email already taken');
        }
      }
      throw error;
    }
  }

  // async getUsers() {
  //   const users = await this.prisma.user.findMany();
  //   return users;
  // }

  generateJwt = async (userId: number): Promise<{ access_token: string }> => {
    const payload = {
      sub: userId,
    };

    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: secret,
    });

    // console.log(token);

    return {
      access_token: `Bearer ${token}`,
    };
  };
}
