import type {
  IdeLanguage,
  IdeRunRequest,
  IdeRunResponse,
  IdeStatusResponse,
} from '@nibras/contracts';
import { serviceFetch } from '../api-clients/service-fetch';

export type { IdeLanguage, IdeRunRequest, IdeRunResponse, IdeStatusResponse };

export async function getIdeStatus(): Promise<IdeStatusResponse> {
  return serviceFetch<IdeStatusResponse>('admin', '/v1/ide/status', { auth: false });
}

export async function listIdeLanguages(): Promise<IdeLanguage[]> {
  const response = await serviceFetch<{ languages: IdeLanguage[] }>('admin', '/v1/ide/languages');
  return response.languages;
}

export async function runIdeCode(payload: IdeRunRequest): Promise<IdeRunResponse> {
  return serviceFetch<IdeRunResponse>('admin', '/v1/ide/run', {
    method: 'POST',
    body: payload,
  });
}
