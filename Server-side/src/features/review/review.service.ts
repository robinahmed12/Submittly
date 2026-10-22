import { prisma } from '@/db/prisma';
import type { Prisma } from '@/generated/prisma/client';
import { ApiError } from '@/lib/errors';
import type { SubmissionStatus } from '@/types/role';
import type { ListSubmissionsQuery, UpdateStatusInput } from './review.schema';

export interface ReviewStudent {
  id: string;
  name: string;
  email: string;
}

export interface ReviewSubmission {
  id: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string | null;
  description: string;
  status: SubmissionStatus;
  createdAt: Date;
  updatedAt: Date;
  student: ReviewStudent;
}

export interface PaginatedSubmissions {
  items: ReviewSubmission[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

type SubmissionWithStudent = Prisma.SubmissionGetPayload<{
  include: { student: { select: { id: true; name: true; email: true } } };
}>;

function toReviewItem(submission: SubmissionWithStudent): ReviewSubmission {
  return {
    id: submission.id,
    projectName: submission.projectName,
    repoUrl: submission.repoUrl,
    liveUrl: submission.liveUrl,
    description: submission.description,
    status: submission.status,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    student: submission.student,
  };
}

/**
 * Paginated, server-side filtered list for the mentor dashboard.
 * `status` is applied in the database (not in memory) — Requirements §4.3.
 */
export async function listSubmissions(query: ListSubmissionsQuery): Promise<PaginatedSubmissions> {
  const { page, limit, status } = query;
  const where = status ? { status } : {};

  const [items, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { student: { select: { id: true, name: true, email: true } } },
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    items: items.map(toReviewItem),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/**
 * Applies a review decision to a PENDING submission.
 *
 * Transition rule (documented): only PENDING → APPROVED | REJECTED. An
 * already-reviewed submission is rejected with 422.
 * The status update and the optional feedback comment are written in one
 * transaction; the conditional update makes concurrent reviews safe.
 *
 * @throws ApiError 404 NOT_FOUND                 when the submission does not exist
 * @throws ApiError 422 INVALID_STATUS_TRANSITION when the submission was already reviewed
 */
export async function updateStatus(
  submissionId: string,
  mentorId: string,
  input: UpdateStatusInput,
): Promise<ReviewSubmission> {
  const existing = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new ApiError(404, 'Submission not found.', 'NOT_FOUND');
  }

  if (existing.status !== 'PENDING') {
    throw new ApiError(
      422,
      `This submission was already reviewed (${existing.status}) and cannot be changed again.`,
      'INVALID_STATUS_TRANSITION',
    );
  }

  const updated = await prisma.$transaction(async tx => {
    // Conditional update: only touches rows still in PENDING (race-safe).
    const result = await tx.submission.updateMany({
      where: { id: submissionId, status: 'PENDING' },
      data: { status: input.status },
    });

    if (result.count === 0) {
      throw new ApiError(
        422,
        'This submission was already reviewed and cannot be changed again.',
        'INVALID_STATUS_TRANSITION',
      );
    }

    if (input.comment) {
      await tx.feedback.create({
        data: { submissionId, mentorId, comment: input.comment },
      });
    }

    return tx.submission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { student: { select: { id: true, name: true, email: true } } },
    });
  });

  return toReviewItem(updated);
}

/** Aggregated dashboard statistics — counts per status (Requirements §4.3). */
export async function getStats(): Promise<ReviewStats> {
  const grouped = await prisma.submission.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  const stats: ReviewStats = { total: 0, pending: 0, approved: 0, rejected: 0 };

  for (const row of grouped) {
    const count = row._count._all;
    stats.total += count;
    if (row.status === 'PENDING') stats.pending = count;
    else if (row.status === 'APPROVED') stats.approved = count;
    else stats.rejected = count;
  }

  return stats;
}

export const reviewService = { listSubmissions, updateStatus, getStats };
