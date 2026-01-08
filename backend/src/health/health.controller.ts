import { Controller, Get } from '@nestjs/common';

interface HealthCheckData {
  status: string;
  timestamp: string;
  uptime: number;
}

@Controller('health')
export class HealthController {
  @Get()
  check(): HealthCheckData {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
