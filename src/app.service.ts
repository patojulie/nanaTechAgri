import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'Bienvenue sur AGRI Intelligent Platform API',
      version: '0.1.0',
      documentation: '/api/docs',
    };
  }
}
