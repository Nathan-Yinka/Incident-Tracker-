import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { AutoSaveDto } from './dto/auto-save.dto';
import { AssignIncidentDto } from './dto/assign-incident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { IncidentOwnershipGuard } from './guards/incident-ownership.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BaseController } from '../common/base/base.controller';
import { LoggerService } from '../common/logger/logger.service';

@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentsController extends BaseController {
  constructor(
    private readonly incidentsService: IncidentsService,
    logger: LoggerService,
  ) {
    super('IncidentsController', logger);
  }

  @Post()
  async create(
    @Body() createIncidentDto: CreateIncidentDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const incident = await this.incidentsService.create(
      createIncidentDto,
      user.id,
      user.role === 'ADMIN',
    );
    return this.handleResponse(incident, 'Incident created successfully');
  }

  @Get()
  async findAll(@Query() query: QueryIncidentsDto, @CurrentUser() user: { id: string; role: string }) {
    const isAdmin = user.role === 'ADMIN';
    const result = await this.incidentsService.findAll(query, user.id, isAdmin);
    return this.handleResponse(result, 'Incidents retrieved successfully');
  }

  @Get('draft')
  async getDraft(@CurrentUser() user: { id: string }) {
    const draft = await this.incidentsService.getDraft(user.id);
    return this.handleResponse(draft, draft ? 'Draft retrieved successfully' : 'No draft found');
  }

  @Get('all')
  @UseGuards(AdminGuard)
  async findAllAdmin(@Query() query: QueryIncidentsDto) {
    const result = await this.incidentsService.findAll(query, '', true);
    return this.handleResponse(result, 'All incidents retrieved successfully');
  }

  @Post('auto-save')
  async autoSave(
    @Body() autoSaveDto: AutoSaveDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const incident = await this.incidentsService.autoSave(user.id, autoSaveDto, user.role === 'ADMIN');
    return this.handleResponse(incident, 'Draft saved');
  }

  @Get(':id')
  @UseGuards(IncidentOwnershipGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const incident = await this.incidentsService.findOne(id);
    return this.handleResponse(incident, 'Incident retrieved successfully');
  }

  @Patch(':id')
  @UseGuards(IncidentOwnershipGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateIncidentDto: UpdateIncidentDto,
    @CurrentUser() user: { id: string },
  ) {
    const incident = await this.incidentsService.update(id, updateIncidentDto, user.id);
    return this.handleResponse(incident, 'Incident updated successfully');
  }

  @Patch(':id/assign')
  @UseGuards(AdminGuard)
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignIncidentDto: AssignIncidentDto,
    @CurrentUser() user: { id: string },
  ) {
    const incident = await this.incidentsService.assign(id, assignIncidentDto, user.id);
    return this.handleResponse(incident, 'Incident assigned successfully');
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) {
    await this.incidentsService.delete(id, user.id);
    return this.handleResponse(null, 'Incident deleted successfully');
  }

  @Delete('draft')
  async deleteDraft(@CurrentUser() user: { id: string }) {
    await this.incidentsService.deleteDraft(user.id);
    return this.handleResponse(null, 'Draft deleted successfully');
  }

  @Get(':id/audit')
  @UseGuards(IncidentOwnershipGuard)
  async getAudit(@Param('id', ParseUUIDPipe) id: string) {
    const auditLogs = await this.incidentsService.auditService.findByIncidentId(id);
    return this.handleResponse(auditLogs, 'Audit logs retrieved successfully');
  }
}
