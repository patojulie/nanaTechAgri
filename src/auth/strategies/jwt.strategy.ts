import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmService } from '../../database/typeorm.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private typeorm: TypeOrmService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.typeorm.utilisateur.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.active) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      active: user.active,
    };
  }
}
