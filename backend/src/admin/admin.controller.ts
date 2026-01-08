import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { QueryAuditDto } from './dto/query-audit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { BaseController } from '../common/base/base.controller';
import { LoggerService } from '../common/logger/logger.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController extends BaseController {
  constructor(
    private readonly adminService: AdminService,
    logger: LoggerService,
  ) {
    super('AdminController', logger);
  }

  @Get('users')
  async getAllUsers(@Query() query: QueryUsersDto) {
    const result = await this.adminService.getAllUsers(query);
    return this.handleResponse(result, 'Users retrieved successfully');
  }

  @Post('users')
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.adminService.createUser(createUserDto);
    return this.handleResponse(user, 'User created successfully');
  }

  @Patch('users/:id/password')
  async changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.adminService.changeUserPassword(id, changePasswordDto);
    return this.handleResponse(null, 'Password changed successfully');
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    const user = await this.adminService.updateUserRole(id, updateUserRoleDto);
    return this.handleResponse(user, 'User role updated successfully');
  }

  @Get('audit')
  async getAllAuditLogs(@Query() query: QueryAuditDto) {
    const result = await this.adminService.getAllAuditLogs(query);
    return this.handleResponse(result, 'Audit logs retrieved successfully');
  }

  @Get('audit/:incidentId')
  async getAuditByIncidentId(@Param('incidentId', ParseUUIDPipe) incidentId: string) {
    const auditLogs = await this.adminService.getAuditByIncidentId(incidentId);
    return this.handleResponse(auditLogs, 'Audit logs retrieved successfully');
  }
}

