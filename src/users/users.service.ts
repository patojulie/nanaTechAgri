import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { TypeOrmService } from '../database/typeorm.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { LanguesService } from '../langues/langues.service';

@Injectable()
export class UsersService {
  private logger = new Logger('UsersService');

  constructor(
    private typeorm: TypeOrmService,
    private languesService: LanguesService,
  ) {}

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.typeorm.utilisateur.find();
    return users.map((user) => this.formatUserResponse(user));
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.typeorm.utilisateur.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    return this.formatUserResponse(user);
  }

  async findByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.typeorm.utilisateur.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'email ${email} non trouvé`);
    }

    return this.formatUserResponse(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.typeorm.utilisateur.findOne({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }

      const { languePreferee, ...rest } = updateUserDto;
      if (languePreferee) {
        await this.languesService.assertValide(languePreferee);
        user.languePrefereeCode = languePreferee;
      }
      Object.assign(user, rest);
      const updated = await this.typeorm.utilisateur.save(user);

      this.logger.log(`Utilisateur mis à jour: ${id}`);
      return this.formatUserResponse(updated);
    } catch (error) {
      throw new BadRequestException('Erreur lors de la mise à jour');
    }
  }

  async deactivate(id: string): Promise<UserResponseDto> {
    const user = await this.typeorm.utilisateur.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    user.active = false;
    const updated = await this.typeorm.utilisateur.save(user);

    this.logger.log(`Utilisateur désactivé: ${id}`);
    return this.formatUserResponse(updated);
  }

  async activate(id: string): Promise<UserResponseDto> {
    const user = await this.typeorm.utilisateur.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    user.active = true;
    const updated = await this.typeorm.utilisateur.save(user);

    this.logger.log(`Utilisateur activé: ${id}`);
    return this.formatUserResponse(updated);
  }

  private formatUserResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      lastName: user.lastName,
      firstName: user.firstName,
      phone: user.phone,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      languePreferee: user.languePrefereeCode,
    };
  }
}
