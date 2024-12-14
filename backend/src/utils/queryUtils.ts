import { Prisma } from '@prisma/client';

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  gender?: string;
  role?: string;
  sportId?: string;
  universityId?: string;
}

export function buildQueryOptions(options: QueryOptions, searchFields: string[]) {
  const page = options.page ? parseInt(options.page.toString()) : 1;
  const limit = options.limit ? parseInt(options.limit.toString()) : 10;
  const skip = (page - 1) * limit;

  let orderBy: { [key: string]: 'asc' | 'desc' } = {};
  if (options.sortBy) {
    orderBy[options.sortBy] = options.sortOrder || 'asc';
  }

  let where: any = {};
  if (options.search) {
    where.OR = searchFields.map((field) => ({
      [field]: { contains: options.search, mode: 'insensitive' },
    }));
  }

  if (options.gender) {
    where.gender = options.gender;
  }

  if (options.role) {
    where.role = options.role;
  }

  if (options.sportId) {
    where.sportId = options.sportId;
  }

  if (options.universityId) {
    where.sport = { universityId: options.universityId };
  }

  return { skip, take: limit, orderBy, where };
}

