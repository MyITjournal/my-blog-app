import type { Request } from 'express';
import { User } from '../../users/entities/user.entity';

export interface GoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  googleId: string;
}

export interface GoogleAuthRequest extends Request {
  user: User;
  ip: string;
}
