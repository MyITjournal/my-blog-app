import { v7 as uuidv7 } from 'uuid';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPassword {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({
    description: 'SHA256 selector for token lookup',
    maxLength: 64,
  })
  tokenSelector!: string;

  @ApiProperty({ description: 'Argon2 hash of the reset token' })
  tokenHash!: string;

  @ApiProperty({ default: false })
  used!: boolean;

  @ApiProperty({ type: 'string', format: 'date-time' })
  expiresAt: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt: Date;

  generateId() {
    this.id = uuidv7();
  }
}
