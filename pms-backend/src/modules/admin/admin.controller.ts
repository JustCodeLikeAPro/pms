import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private svc: AdminService) {}

  // ------- Constants / DTOs -------

  // Single place to keep role names aligned with the UI
  private static readonly ROLE_CATALOG = [
    'Admin',
    'Customer',
    'PMC',
    'Architect',
    'Designer',
    'Contractor',
    'Legal/Liasoning',
    'Ava-PMT',
    'Engineer (Contractor)',
    'DC (Contractor)',
    'DC (PMC)',
    'Inspector (PMC)',
    'HOD (PMC)',
  ] as const;

  // Create Project DTO
  // (kept same shape you already had)
  @Post('projects')
  createProject(
    @Body()
    dto: {
      code: string;
      name: string;
      city: string;
      status?: string;
      stage: string;
      health?: string;
    },
  ) {
    return this.svc.createProject(dto);
  }

  // List Projects (supports optional q)
  @Get('projects')
  listProjects(@Query('q') q?: string) {
    return this.svc.listProjects(q);
  }

  // ------- Users -------

  // Create User (used by "Create New User" page)
  // Ensure AdminService has a matching createUser(dto).
  @Post('users')
  async createUser(
    @Body()
    dto: {
      code: string;
      role: string;
      name: string;
      city?: string;
      email?: string | null;
      phone?: string | null;
      isSuperAdmin?: boolean;
    },
  ) {
    // (optional) minimal validation
    if (!dto?.code || !dto?.role || !dto?.name) {
      throw new BadRequestException('code, role and name are required');
    }
    return this.svc.createUser(dto);
  }

  // Search/List Users (q optional; if not provided, return all)
  @Get('users')
  searchUsers(@Query('q') q?: string) {
    return this.svc.searchUsers(q || '');
  }

  // ------- Roles Catalog / Overview -------

  // Simple roles catalog for the "View Roles" page
  @Get('roles/catalog')
  rolesCatalog() {
    return { ok: true, roles: AdminController.ROLE_CATALOG };
  }

  // (Optional) Overview endpoint - keep as placeholder if you want stats later
  // @Get('roles/overview')
  // rolesOverview() {
  //   return this.svc.rolesOverview(); // implement in service if needed
  // }

  // ------- Assignments (legacy single) -------

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

  // ------- Project Roles (read) & Bulk Assign -------

  /**
   * Returns current role assignments for a project as a map:
   * { ok: true, assignments: { [role]: userId | null } }
   *
   * Consumed by: GET /admin/projects/:id/roles
   */
  @Get('projects/:id/roles')
  async getProjectRoles(@Param('id') projectId: string) {
    // Reuse existing service method to fetch all current links
    const result = await this.svc.listAssignments(projectId);
    // Expect result to be either { ok, items } or an array; normalize
    const items: Array<{ id?: string; role: string; userId: string | null }> =
      Array.isArray((result as any)?.items) ? (result as any).items : (result as any);

    const assignments: Record<string, string | null> = {};
    // Initialize all roles to null so UI gets a complete set
    for (const role of AdminController.ROLE_CATALOG) assignments[role] = null;

    for (const row of items || []) {
      if (row?.role) assignments[row.role] = row.userId ?? null;
    }
    return { ok: true, assignments };
  }

  /**
   * Accepts a full snapshot of assignments and reconciles differences by:
   *  - Removing obsolete assignments
   *  - Adding/Updating changed ones
   *
   * Body shape: { assignments: { [role]: userId|null } }
   * Consumed by: POST /admin/projects/:id/assign-roles
   */
  @Post('projects/:id/assign-roles')
  async setProjectRoles(
    @Param('id') projectId: string,
    @Body() body: { assignments: Record<string, string | null> },
  ) {
    if (!body || typeof body.assignments !== 'object') {
      throw new BadRequestException('assignments object is required');
    }

    // 1) Load current assignments
    const currentRes = await this.svc.listAssignments(projectId);
    const currentItems: Array<{ id: string; role: string; userId: string | null }> =
      Array.isArray((currentRes as any)?.items) ? (currentRes as any).items : (currentRes as any);

    // Map current by role for quick lookup
    const currentByRole = new Map<string, { id: string; userId: string | null }>();
    for (const row of currentItems || []) {
      if (row?.role && row?.id) currentByRole.set(row.role, { id: row.id, userId: row.userId ?? null });
    }

    // Normalize incoming: ensure we only consider known roles
    const desired: Record<string, string | null> = {};
    for (const role of AdminController.ROLE_CATALOG) {
      desired[role] = body.assignments.hasOwnProperty(role) ? body.assignments[role] : null;
    }

    // 2) Remove roles that should be None/null
    for (const [role, cur] of currentByRole) {
      const nextUserId = desired[role] ?? null;
      if (nextUserId === null) {
        // remove existing assignment
        await this.svc.removeAssignment(cur.id);
      }
    }

    // 3) Upsert (assign new/different)
    for (const role of AdminController.ROLE_CATALOG) {
      const nextUserId = desired[role] ?? null;
      const cur = currentByRole.get(role); // may be undefined
      const curUserId = cur?.userId ?? null;

      // if both null -> nothing to do
      if (curUserId === null && nextUserId === null) continue;

      // if same user -> nothing to do
      if (curUserId && nextUserId && curUserId === nextUserId) continue;

      // else (no current and we have next) OR (different user)
      if (nextUserId) {
        await this.svc.assign({ projectId, userId: nextUserId, role });
      }
      // Note: we already removed cur when next is null in step (2)
      // If you prefer full replace: you can remove cur first then assign.
    }

    return { ok: true };
  }
}
