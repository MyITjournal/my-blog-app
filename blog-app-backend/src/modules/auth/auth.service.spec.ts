jest.mock('uuid', () => ({
  v7: jest.fn().mockReturnValue('00000000-0000-0000-0000-000000000000'),
}));

jest.mock('../../config/env', () => ({
  env: {
    JWT_ACCESS_SECRET: 'test-access-secret-at-least-32-chars-long',
    JWT_RESET_SECRET: 'test-reset-secret-at-least-32-chars-long',
    OTP_OVERRIDE: undefined,
  },
}));

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('mocked-argon2-hash'),
  verify: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  GoneException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RateLimiterService } from '../rate-limiter/rate-limiter.service';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../../common/redis/redis.service';
import { TokenService } from './services/token.service';
import { AuthProvider, User } from '../users/entities/user.entity';

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  isVerified: false,
  authProvider: AuthProvider.EMAIL,
  password: 'hashed-password',
  otpHash: 'mocked-argon2-hash',
  otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
  lastLoginIp: null,
  onboardingComplete: false,
  role: null,
  deletedAt: null,
} as unknown as User;

const mockVerifiedUser = {
  ...mockUser,
  isVerified: true,
  password: 'hashed-password',
} as unknown as User;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Record<string, jest.Mock>;
  let mailService: Record<string, jest.Mock>;
  let redisService: Record<string, jest.Mock>;
  let rateLimiterService: Record<string, jest.Mock>;
  let tokenService: Record<string, jest.Mock>;
  let jwtService: Record<string, jest.Mock>;

  beforeEach(async () => {
    const mockUsersService = {
      createEmailUser: jest.fn(),
      storeOtpHash: jest.fn(),
      findByEmail: jest.fn(),
      findOne: jest.fn(),
      clearOtp: jest.fn(),
      clearOtpOnly: jest.fn(),
      updateLastLoginIp: jest.fn(),
      updatePassword: jest.fn(),
      logOAuthLogin: jest.fn(),
      linkGoogleAccount: jest.fn(),
      createGoogleUser: jest.fn(),
    };

    const mockMailService = {
      sendVerificationOtp: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetOtp: jest.fn().mockResolvedValue(undefined),
      sendPasswordChangedEmail: jest.fn().mockResolvedValue(undefined),
      sendAccountLockedEmail: jest.fn().mockResolvedValue(undefined),
      sendNewIpLoginEmail: jest.fn().mockResolvedValue(undefined),
    };

    const mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      increment: jest.fn().mockResolvedValue(1),
    };

    const mockRateLimiterService = {
      isAllowed: jest.fn().mockResolvedValue(true),
    };

    const mockTokenService = {
      generateAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
      generateRefreshToken: jest.fn().mockResolvedValue('mock-refresh-token'),
      setTokenCookies: jest.fn(),
      clearTokenCookies: jest.fn(),
      rotateTokens: jest.fn(),
      invalidateRefreshToken: jest.fn(),
      invalidateAllRefreshTokens: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RateLimiterService, useValue: mockRateLimiterService },
        { provide: MailService, useValue: mockMailService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    mailService = module.get(MailService);
    redisService = module.get(RedisService);
    rateLimiterService = module.get(RateLimiterService);
    tokenService = module.get(TokenService);
    jwtService = module.get(JwtService);
    jest.clearAllMocks();

    // Re-apply defaults after clearAllMocks
    (redisService.get as jest.Mock).mockResolvedValue(null);
    (redisService.increment as jest.Mock).mockResolvedValue(1);
    (rateLimiterService.isAllowed as jest.Mock).mockResolvedValue(true);
    (tokenService.generateAccessToken as jest.Mock).mockResolvedValue(
      'mock-access-token',
    );
    (tokenService.generateRefreshToken as jest.Mock).mockResolvedValue(
      'mock-refresh-token',
    );
    (jwtService.signAsync as jest.Mock).mockResolvedValue('mock-jwt-token');
    (mailService.sendVerificationOtp as jest.Mock).mockResolvedValue(undefined);
    (mailService.sendPasswordResetOtp as jest.Mock).mockResolvedValue(
      undefined,
    );
  });

  // ─── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    const dto = {
      email: 'test@example.com',
      password: 'StrongPass1!',
      firstName: 'Test',
      lastName: 'User',
    };

    it('creates user, stores OTP hash, sends email, and returns success', async () => {
      usersService.createEmailUser.mockResolvedValue(mockUser);

      const result = await service.register(dto);

      expect(usersService.createEmailUser).toHaveBeenCalledWith({
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });
      expect(usersService.storeOtpHash).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
        expect.any(Date),
      );
      expect(mailService.sendVerificationOtp).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.firstName,
        expect.any(String),
      );
      expect(result).toEqual({
        status: 'pending_verification',
        message: 'A verification code has been sent to your email address.',
      });
    });

    it('still returns success when email sending fails (non-blocking)', async () => {
      usersService.createEmailUser.mockResolvedValue(mockUser);
      (mailService.sendVerificationOtp as jest.Mock).mockRejectedValue(
        new Error('Resend rejected'),
      );

      const result = await service.register(dto);

      expect(result).toEqual({
        status: 'pending_verification',
        message: 'A verification code has been sent to your email address.',
      });
    });

    it('does not store OTP or send email when user creation fails', async () => {
      usersService.createEmailUser.mockRejectedValue(
        new ConflictException({ error: 'EMAIL_ALREADY_EXISTS' }),
      );

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(usersService.storeOtpHash).not.toHaveBeenCalled();
      expect(mailService.sendVerificationOtp).not.toHaveBeenCalled();
    });
  });

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    const dto = { email: 'test@example.com', password: 'StrongPass1!' };
    const ip = '127.0.0.1';
    const mockReq = { cookies: {}, socket: { remoteAddress: ip } } as any;
    const mockRes = {} as any;

    it('throws 429 when IP rate limit is exceeded', async () => {
      (redisService.increment as jest.Mock).mockResolvedValue(11);

      await expect(service.login(dto, ip, mockReq, mockRes)).rejects.toThrow(
        HttpException,
      );
    });

    it('throws UnauthorizedException when user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(dto, ip, mockReq, mockRes)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws BadRequestException when user registered via Google OAuth', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockVerifiedUser,
        authProvider: AuthProvider.GOOGLE,
      });

      await expect(service.login(dto, ip, mockReq, mockRes)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('sends new OTP and returns success when user is unverified', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.login(dto, ip, mockReq, mockRes);

      expect(usersService.clearOtpOnly).toHaveBeenCalledWith(mockUser.id);
      expect(usersService.storeOtpHash).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'pending_verification',
        message: 'A verification code has been sent to your email address.',
      });
    });

    it('throws 429 when account is locked', async () => {
      usersService.findByEmail.mockResolvedValue(mockVerifiedUser);
      (redisService.get as jest.Mock).mockResolvedValue('1');

      await expect(service.login(dto, ip, mockReq, mockRes)).rejects.toThrow(
        HttpException,
      );
    });

    it('throws UnauthorizedException on incorrect password', async () => {
      usersService.findByEmail.mockResolvedValue(mockVerifiedUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto, ip, mockReq, mockRes)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns user data and sets cookies on successful login', async () => {
      usersService.findByEmail.mockResolvedValue(mockVerifiedUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      usersService.updateLastLoginIp.mockResolvedValue(undefined);

      const result = await service.login(dto, ip, mockReq, mockRes);

      expect(tokenService.setTokenCookies).toHaveBeenCalled();
      expect(result).toMatchObject({
        status: 'success',
        user: { email: mockVerifiedUser.email },
      });
    });
  });

  // ─── verifyOtp ───────────────────────────────────────────────────────────────

  describe('verifyOtp', () => {
    const dto = { email: 'test@example.com', otp: '123456' };
    const mockReq = {} as any;
    const mockRes = {} as any;

    it('throws BadRequestException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.verifyOtp(dto, mockReq, mockRes)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ConflictException when user is already verified', async () => {
      usersService.findByEmail.mockResolvedValue(mockVerifiedUser);

      await expect(service.verifyOtp(dto, mockReq, mockRes)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws BadRequestException when no OTP is stored', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        otpHash: null,
        otpExpiresAt: null,
      });

      await expect(service.verifyOtp(dto, mockReq, mockRes)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws GoneException when OTP has expired', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        otpExpiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.verifyOtp(dto, mockReq, mockRes)).rejects.toThrow(
        GoneException,
      );
    });

    it('throws BadRequestException when OTP is incorrect', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.verifyOtp(dto, mockReq, mockRes)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('clears OTP, sets cookies, and returns user data on valid OTP', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.verifyOtp(dto, mockReq, mockRes);

      expect(usersService.clearOtp).toHaveBeenCalledWith(mockUser.id);
      expect(tokenService.setTokenCookies).toHaveBeenCalled();
      expect(result).toMatchObject({
        status: 'success',
        message: 'Email verified successfully.',
        user: { email: mockUser.email },
      });
    });
  });

  // ─── resendOtp ───────────────────────────────────────────────────────────────

  describe('resendOtp', () => {
    it('throws 429 when rate limited', async () => {
      (rateLimiterService.isAllowed as jest.Mock).mockResolvedValue(false);
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.resendOtp('test@example.com')).rejects.toThrow(
        HttpException,
      );
    });

    it('returns generic message when user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.resendOtp('unknown@example.com');

      expect(result).toEqual({
        message: 'If the email exists, an OTP has been sent',
      });
    });

    it('returns generic message when user is already verified', async () => {
      usersService.findByEmail.mockResolvedValue(mockVerifiedUser);

      const result = await service.resendOtp('test@example.com');

      expect(result.message).toContain('instructions shortly');
      expect(mailService.sendVerificationOtp).not.toHaveBeenCalled();
    });

    it('clears OTP, stores new hash, sends email, and returns success', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.resendOtp('test@example.com');

      expect(usersService.clearOtp).toHaveBeenCalledWith(mockUser.id);
      expect(usersService.storeOtpHash).toHaveBeenCalled();
      expect(mailService.sendVerificationOtp).toHaveBeenCalled();
      expect(result).toEqual({ message: 'OTP has been sent successfully' });
    });

    it('still returns success when email sending fails (non-blocking)', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (mailService.sendVerificationOtp as jest.Mock).mockRejectedValue(
        new Error('Resend rejected'),
      );

      const result = await service.resendOtp('test@example.com');

      expect(result).toEqual({ message: 'OTP has been sent successfully' });
    });
  });

  // ─── forgotPassword ───────────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    const dto = { email: 'test@example.com' };

    it('throws 429 when rate limited', async () => {
      (rateLimiterService.isAllowed as jest.Mock).mockResolvedValue(false);

      await expect(service.forgotPassword(dto)).rejects.toThrow(HttpException);
    });

    it('returns generic message without sending email for unknown address', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword(dto);

      expect(mailService.sendPasswordResetOtp).not.toHaveBeenCalled();
      expect(result).toMatchObject({ status: 'success' });
    });

    it('returns generic message without sending email for Google OAuth user', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockVerifiedUser,
        authProvider: AuthProvider.GOOGLE,
      });

      const result = await service.forgotPassword(dto);

      expect(mailService.sendPasswordResetOtp).not.toHaveBeenCalled();
      expect(result).toMatchObject({ status: 'success' });
    });

    it('stores OTP and sends reset email for valid email user', async () => {
      usersService.findByEmail.mockResolvedValue(mockVerifiedUser);

      const result = await service.forgotPassword(dto);

      expect(usersService.storeOtpHash).toHaveBeenCalled();
      expect(mailService.sendPasswordResetOtp).toHaveBeenCalledWith(
        mockVerifiedUser.email,
        expect.any(String),
      );
      expect(result).toMatchObject({ status: 'success' });
    });

    it('still returns success when email sending fails', async () => {
      usersService.findByEmail.mockResolvedValue(mockVerifiedUser);
      (mailService.sendPasswordResetOtp as jest.Mock).mockRejectedValue(
        new Error('Resend rejected'),
      );

      const result = await service.forgotPassword(dto);

      expect(result).toMatchObject({ status: 'success' });
    });
  });
});
