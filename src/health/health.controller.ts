import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private dataSource: DataSource,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check avec statut BD' })
  check() {
    return this.health.check([
      () =>
        this.db.pingCheck('database', {
          connection: this.dataSource,
        }),
    ]);
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe' })
  async ready() {
    return this.health.check([
      () =>
        this.db.pingCheck('database', {
          connection: this.dataSource,
        }),
    ]);
  }
}
