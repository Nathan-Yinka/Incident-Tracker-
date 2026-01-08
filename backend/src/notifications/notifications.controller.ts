import { Controller, Get, Patch, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BaseController } from '../common/base/base.controller';
import { LoggerService } from '../common/logger/logger.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController extends BaseController {
  constructor(
    private readonly notificationsService: NotificationsService,
    logger: LoggerService,
  ) {
    super('NotificationsController', logger);
  }

  @Get()
  async findAll(@Query() query: QueryNotificationsDto, @CurrentUser() user: { id: string }) {
    const result = await this.notificationsService.findAll(user.id, query);
    return this.handleResponse(result, 'Notifications retrieved successfully');
  }

  @Patch(':id/read')
  async markAsRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) {
    const notification = await this.notificationsService.markAsRead(id, user.id);
    return this.handleResponse(notification, 'Notification marked as read');
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: { id: string }) {
    await this.notificationsService.markAllAsRead(user.id);
    return this.handleResponse(null, 'All notifications marked as read');
  }
}

