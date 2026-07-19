import { DOCTRINE_VERSION } from '../config/product';
import type { AiProvider, ReflectionRequest } from '../providers/types';

export class ReflectionEngine {
  constructor(private readonly provider: AiProvider) {}

  reflect(request: Omit<ReflectionRequest, 'doctrineVersion'>, signal?: AbortSignal) {
    return this.provider.reflect({ ...request, doctrineVersion: DOCTRINE_VERSION }, signal);
  }
}
