import { User } from '../../users/entities/user.entity';

export class RefreshToken {
  id: string;

  userId: string;

  user: User;

  tokenHash: string;

  expiresAt: Date;

  createdAt: Date;
}
