import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private svc: AdminService) {}

  @Post('projects')
  createProject(@Body() dto: { code: string; name: string; city: string; status?: string; stage: string; health?: string }) {
    return this.svc.createProject(dto);
  }

  @Get('projects')
  listProjects(@Query('q') q?: string) {
    return this.svc.listProjects(q);
  }

  @Get('users')
  searchUsers(@Query('q') q: string) {
    return this.svc.searchUsers(q);
  }

  @Post('assignments')
  assign(@Body() dto: { projectId: string; userId: string; role: string }) {
    return this.svc.assign(dto);
  }

  @Get('assignments')
  listAssignments(@Query('projectId') projectId: string) {
    return this.svc.listAssignments(projectId);
  }

  @Delete('assignments')
  removeAssignment(@Query('id') id: string) {
    return this.svc.removeAssignment(id);
  }
}
