import { prisma } from '@/db/prisma';
import { Prisma, type Submission } from '@/generated/prisma/client';
import { ApiError } from '@/lib/errors';
import { normalizeRepoUrl } from '@/lib/repo-url';
import type { SubmissionStatus } from '@/types/role';
import type { CreateSubmissionInput } from './submission.schema';

export interface SubmissionView {
  id: string;
  studentId: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string | null;
  description: string;
  status: SubmissionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmissionList {
  items: SubmissionView[];
  total: number;
}

function toView(submission: Submission): SubmissionView {
  return {
    id: submission.id,
    studentId: submission.studentId,
    projectName: submission.projectName,
    repoUrl: submission.repoUrl,
    liveUrl: submission.liveUrl,
    description: submission.description,
    status: submission.status,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

/**
 * Creates a submission for the authenticated student.
 *
 * The repo URL is normalized before storage, and the documented duplicate rule
 * (one repo URL per student) is enforced by the database unique constraint.
 *
 * @throws ApiError 409 DUPLICATE_SUBMISSION when this student already submitted this repo URL
 */
export async function createSubmission(
  studentId: string,
  input: CreateSubmissionInput,
): Promise<SubmissionView> {
  const repoUrl = normalizeRepoUrl(input.repoUrl);

  try {
    const submission = await prisma.submission.create({
      data: {
        studentId,
        projectName: input.projectName,
        repoUrl,
        liveUrl: input.liveUrl ?? null,
        description: input.description,
        // status defaults to PENDING (set by the schema) — only mentors change it.
      },
    });
    return toView(submission);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ApiError(
        409,
        'You have already submitted a project with this repository URL.',
        'DUPLICATE_SUBMISSION',
      );
    }
    throw error;
  }
}

/**
 * Lists the authenticated student's own submissions, newest first.
 * Scoped by the token's user id — a student can never read someone else's.
 */
export async function listMySubmissions(studentId: string): Promise<SubmissionList> {
  const [items, total] = await Promise.all([
    prisma.submission.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.submission.count({ where: { studentId } }),
  ]);

  return { items: items.map(toView), total };
}

export const submissionService = { createSubmission, listMySubmissions };
