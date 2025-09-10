import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  createProject(dto: { code: string; name: string; city: string; status?: string; stage: string; health?: string }) {
    if (!dto.code?.trim() || !dto.name?.trim() || !dto.city?.trim() || !dto.stage?.trim()) {
      throw new BadRequestException('code, name, city, stage are required');
    }
    return this.prisma.project.create({
      data: {
        code: dto.code.trim(),
        name: dto.name.trim(),
        city: dto.city.trim(),
        stage: dto.stage.trim(),
        status: dto.status?.trim() || 'Ongoing',
        health: dto.health?.trim() || 'Good',
      },
    });
  }

  listProjects(q?: string) {
    return this.prisma.project.findMany({
      where: q
        ? { OR: [{ code: { contains: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } }] }
        : undefined,
      orderBy: { name: 'asc' },
      take: 50,
    });
  }

  searchUsers(q: string) {
    if (!q?.trim()) throw new BadRequestException('q required');
    return this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 50,
      orderBy: { name: 'asc' },
    });
  }

  assign(dto: { projectId: string; userId: string; role: string }) {
    if (!dto.projectId || !dto.userId || !dto.role) throw new BadRequestException('projectId, userId, role required');
    return this.prisma.projectMember.create({ data: dto as any });
  }

  listAssignments(projectId: string) {
    if (!projectId) throw new BadRequestException('projectId required');
    return this.prisma.projectMember.findMany({ where: { projectId }, include: { user: true }, orderBy: { createdAt: 'desc' } });
  }

  removeAssignment(id: string) {
    if (!id) throw new BadRequestException('id required');
    return this.prisma.projectMember.delete({ where: { id } });
  }
}
