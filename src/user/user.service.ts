import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignupDto } from 'src/user/dto/SignupDto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async signup(dto: SignupDto) {
    // Implement the signup logic here
    // For example, you might want to create a new user in the database]

    const user = await this.prisma.user.create({
      data: {
        nameid: dto.user_id,
        nickname: dto.user_id,
        password: dto.password, // Ensure to hash the password before storing it
      },
    });
    return user;
  }
  async findByCredentials(user_id: string, password: string) {
    // Implement the logic to find a user by credentials

    const user = await this.prisma.user.findUnique({
      where: {
        nameid: user_id,
      },
    });

    if (!user) {
      return null; // User not found
    }

    if (user && user.password === password) {
      return user;
    } else {
      throw new UnauthorizedException();
    }
  }
}
