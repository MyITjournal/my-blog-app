import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  async addJob<TPayload>(
    queue: string,
    jobName: string,
    payload: TPayload,
  ): Promise<void> {
    this.logger.debug(
      `Queued job: queue=${queue} job=${jobName} payload=${JSON.stringify(payload)}`,
    );
  }
}
