import { Injectable, BadRequestException, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { TypeOrmService } from '../database/typeorm.service';
import { RegisterDto, LoginDto, RefreshTokenDto, AuthResponseDto } from './dto/auth.dto';
import { Role } from '../database/entities';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');
  private readonly SALT_ROUNDS = 10;

  constructor(
    private typeorm: TypeOrmService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, lastName, firstName, role, phone } = registerDto;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.typeorm.utilisateur.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    try {
      // Create user
      const user = await this.typeorm.utilisateur.save({
        email,
        passwordHash,
        lastName,
        firstName,
        role,
        phone,
        accessChannelPreferences: ['MOBILE_APP', 'WEB'],
      } as any);

      this.logger.log(`New user created: ${user.id} (${role})`);

      // Generate tokens
      return this.generateTokensAndResponse(user);
    } catch (error) {
      this.logger.error(`Error during registration: ${error.message}`);
      throw new BadRequestException('Error during registration');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.typeorm.utilisateur.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.active) {
      throw new UnauthorizedException('This user is inactive');
    }

    this.logger.log(`Successful login: ${user.id}`);

    // Generate tokens
    return this.generateTokensAndResponse(user);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      const payload = await this.jwtService.verifyAsync(
        refreshTokenDto.refreshToken,
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
        },
      );

      const user = await this.typeorm.utilisateur.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.active) {
        throw new UnauthorizedException('Invalid or inactive user');
      }

      return this.generateTokensAndResponse(user);
    } catch (error) {
      this.logger.warn(`Error refreshing token: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(id: string) {
    const user = await this.typeorm.utilisateur.findOne({
      where: { id },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid user');
    }

    return user;
  }

  private async generateTokensAndResponse(user: any): Promise<AuthResponseDto> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    // Short-lived access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION'),
    });

    // Long-lived refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: parseInt(this.configService.get('JWT_EXPIRATION_TIME') || '900'),
      user: {
        id: user.id,
        email: user.email,
        lastName: user.lastName,
        firstName: user.firstName,
        role: user.role,
        isActive: user.isActive || true,
        createdAt: user.createdAt || new Date(),
      },
    };
  }

  // Token spécial pour les agents hors-ligne avec longue durée
  generateOfflineAgentToken(userId: string, role: Role): string {
    const payload = { sub: userId, role, type: 'offline-agent' };
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_OFFLINE_AGENT_EXPIRATION'),
    });
  }
}
