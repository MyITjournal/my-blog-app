import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(dto: SubscribeNewsletterDto) {
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('This email is already subscribed.');
    }

    await this.prisma.newsletterSubscriber.create({
      data: { email: dto.email },
    });

    return { message: 'You have successfully subscribed to our newsletter.' };
  }
}
