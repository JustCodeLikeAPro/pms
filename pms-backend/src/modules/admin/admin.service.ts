import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

type CreateProjectDto = {
  code: string;
  name: string;
  city: string;
  status?: string;
  stage: string;
  health?: string;
};

type CreateUserDto = {
  code: string;
  role: string;
  name: string;
  city?: string;
  email?: string | null;
  phone?: string | null;
  isSuperAdmin?: boolean;
};

type AssignDto = {
  projectId: string;
  userId: string;
  role: string;
};

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // -----------------------
  // Helpers (private)
  // -----------------------
  private normStr(v?: string | null) {
    return (v ?? '').trim();
  }

  private normEmail(v?: string | null) {
    const s = this.normStr(v);
    return s ? s.toLowerCase() : null;
  }

  private normPhone(v?: string | null) {
    const s = this.normStr(v);
    if (!s) return null;
    const digits = s.replace(/[^\d]/g, '');
    return digits || null;
  }

  // -----------------------
  // Projects
  // -----------------------
  async createProject(dto: CreateProjectDto) {
    const code = this.normStr(dto.code).toUpperCase();
    const name = this.normStr(dto.name);
    const city = this.normStr(dto.city);
    const stage = this.normStr(dto.stage);
    const status = this.normStr(dto.status) || 'Ongoing';
    const health = this.normStr(dto.health) || 'Good';

    if (!code || !name || !city || !stage) {
      throw new BadRequestException('code, name, city, stage are required');
    }

    // Optional: basic uniqueness check for code
    // If you have a unique index on Project.code, Prisma will also throw
    const exists = await this.prisma.project.findFirst({ where: { code } });
    if (exists) throw new BadRequestException(`Project code "${code}" already exists`);

    return this.prisma.project.create({
      data: { code, name, city, stage, status, health },
    });
  }

  listProjects(q?: string) {
    const query = this.normStr(q);
    return this.prisma.project.findMany({
      where: query
        ? {
            OR: [
              { code: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
              { city: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: [{ name: 'asc' }],
      take: 50,
    });
  }

  // -----------------------
  // Users
  // -----------------------
  async createUser(dto: CreateUserDto) {
    const code = this.normStr(dto.code).toUpperCase();
    const role = this.normStr(dto.role);
    const name = this.normStr(dto.name);
    const city = this.normStr(dto.city);
    const email = this.normEmail(dto.email);
    const phone = this.normPhone(dto.phone);
    const isSuperAdmin = !!dto.isSuperAdmin;

    if (!code || !role || !name) {
      throw new BadRequestException('code, role and name are required');
    }
    if (!email && !phone) {
      // Optional: enforce at least one contact channel
      // If you prefer to allow blank, remove this check.
      throw new BadRequestException('Either email or phone is required');
    }

    // Optional uniqueness checks (adjust if your schema enforces unique already)
    const [codeExists, emailExists, phoneExists] = await Promise.all([
      this.prisma.user.findFirst({ where: { code } }),
      email ? this.prisma.user.findFirst({ where: { email } }) : null,
      phone ? this.prisma.user.findFirst({ where: { phone } }) : null,
    ]);

    if (codeExists) throw new BadRequestException(`User code "${code}" already exists`);
    if (emailExists) throw new BadRequestException(`Email "${email}" already in use`);
    if (phoneExists) throw new BadRequestException(`Phone "${phone}" already in use`);

    return this.prisma.user.create({
      data: {
        code,
        role,
        name,
        city: city || null,
        email,
        phone,
        isSuperAdmin,
      },
    });
  }

   /**
   * Search users by query. If q is omitted/blank, return recent users.
   * Used by /admin/users (list) and Assign Roles picker.
   */
  async searchUsers(q?: string) {
    const query = (q ?? '').trim();

    // No query → recent users
    if (!query) {
      return this.prisma.user.findMany({
        orderBy: [{ createdAt: 'desc' }],
        take: 50,
      });
    }

    // With query → filter across common fields
    return this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
          { role: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      },
      take: 50,
      orderBy: [{ name: 'asc' }],
    });
  }

  // -----------------------
  // Assignments (ProjectMember)
  // -----------------------
  /**
   * Creates a ProjectMember row.
   * If you want to prevent duplicates per (projectId, role), consider
   * using an upsert or a unique composite index in your Prisma schema.
   */
  async assign(dto: AssignDto) {
    const projectId = this.normStr(dto.projectId);
    const userId = this.normStr(dto.userId);
    const role = this.normStr(dto.role);

    if (!projectId || !userId || !role) {
      throw new BadRequestException('projectId, userId, role required');
    }

    // Optional: validate FKs exist for clearer error messages
    const [proj, user] = await Promise.all([
      this.prisma.project.findUnique({ where: { projectId } }),
      this.prisma.user.findUnique({ where: { userId } }),
    ]);
    if (!proj) throw new BadRequestException('Invalid projectId');
    if (!user) throw new BadRequestException('Invalid userId');

    return this.prisma.projectMember.create({
      data: { projectId, userId, role },
    });
  }

  /**
   * Returns all assignments for a project (with joined User).
   * Controller normalizes to { ok, assignments: { [role]: userId|null } } where needed.
   */
  listAssignments(projectId: string) {
    const pid = this.normStr(projectId);
    if (!pid) throw new BadRequestException('projectId required');

    return this.prisma.projectMember.findMany({
      where: { projectId: pid },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  removeAssignment(id: string) {
    const pid = this.normStr(id);
    if (!pid) throw new BadRequestException('id required');
    return this.prisma.projectMember.delete({ where: { id: pid } });
  }
}
