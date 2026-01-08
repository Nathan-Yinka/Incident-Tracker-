import { Controller, Get } from '@nestjs/common';

interface HealthCheckData {
  status: string;
  timestamp: string;
  uptime: number;
}

@Controller()
export class HealthController {
  @Get()
  root(): HealthCheckData {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('health')
  health(): HealthCheckData {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
