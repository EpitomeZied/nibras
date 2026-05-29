import { MeResponseSchema } from '@nibras/contracts';
import { apiRequest } from '@nibras/core';
import { printBox } from '../ui/box';
import { emitJson } from '../util/output';

export async function commandWhoami(plain: boolean, json: boolean): Promise<void> {
  const response = MeResponseSchema.parse(await apiRequest('/v1/me'));

  if (json) {
    emitJson(response);
    return;
  }

  printBox(
    `Signed in as ${response.user.username}`,
    [
      `User:    ${response.user.username}`,
      `GitHub:  ${response.user.githubLogin}`,
      `API:     ${response.apiBaseUrl}`,
    ],
    'info',
    plain
  );
}
