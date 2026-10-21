import type { ApiErrorDetail } from '@/lib/errors';

export interface ApiSuccessEnvelope<TData> {
  success: true;
  data: TData;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  code?: string;
  details?: ApiErrorDetail[];
}
