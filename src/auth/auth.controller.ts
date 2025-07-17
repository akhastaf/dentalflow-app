import { Body, Controller, Post, Res, Req, UseGuards, Get, Param } from '@nestjs/common';
import { AuthService, LoginResponse } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { User } from 'src/user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignInData } from 'src/types/signin-data';
import { JwtPayload } from 'src/types/jwt-payload';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response, Request } from 'express';
import { Setup2FADto } from './dto/setup-2fa.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { Disable2FADto } from './dto/disable-2fa.dto';
import { Complete2FADto } from './dto/complete-2fa.dto';
import { VerifyBackupCodeDto } from './dto/verify-backup-code.dto';
import { AuthGuard } from './guards/auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { TwoFactorAuthGuard } from './guards/two-factor-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { CurrentUserRefresh } from './decorators/current-user-refresh.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { EmailTokenType } from 'src/database/entities/email-token.entity';
import { EmailTokenService } from 'src/mail/email-token.service';
import { MailService } from 'src/mail/mail.service';
import { TwoFactorService } from './two-factor.service';
import { UserService } from 'src/user/users.service';
import { TenantService } from 'src/tenant/tenant.service';
import { StaffService } from 'src/staff/staff.service';
import { TenantResponseDto } from 'src/tenant/dtos/tenant-response.dto';
import { StaffResponseDto } from 'src/staff/dtos/staff-response.dto';
import { UserResponseDto } from './dto/user-response.dto';


interface TwoFactorRequiredResponse {
  access_token: null;
  user: null;
  requires2FA: true;
  twoFactorMethods: {
    authenticator: boolean;
    email: boolean;
  };
  twoFactorToken: string;
  expiresIn: number;
}

// In-memory map for email code resend restriction (for demo; use Redis in prod)
const email2FAResendMap = new Map<string, boolean>();

@ApiTags('Authentication')
@Controller({
  path: 'auth',
  version: '1'
})
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly emailTokenService: EmailTokenService,
    private readonly tenantService: TenantService,
    private readonly staffService: StaffService
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerDto: RegisterDto) : Promise<{ user: User; tenant: any; staff: any }> {
    console.log('register authController ', registerDto);
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(
    @Body() loginDto: LoginDto, 
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ) : Promise<SignInData | LoginResponse | TwoFactorRequiredResponse> {
    console.log('login dto', loginDto);
    try {
      const loginResponse: LoginResponse = await this.authService.login(loginDto, req);
      
      // If 2FA is required, return early with pre-auth token
      if (loginResponse.requires2FA) {
        return {
          access_token: null,
          user: null,
          requires2FA: true,
          twoFactorMethods: loginResponse.twoFactorMethods!,
          twoFactorToken: loginResponse.preAuthToken!,
          expiresIn: 600, // 10 minutes
        };
      }

      // Normal login flow - user is guaranteed to be non-null here
      if (!loginResponse.user) {
        throw new Error('User should not be null in normal login flow');
      }
      
      const expireIn: Date = new Date();
      expireIn.setMonth(expireIn.getMonth() + 3);
      
      const payload: JwtPayload = {
          sub: loginResponse.user.user_id,
          email: loginResponse.user.email
      };
      
      const jwtOptions: JwtSignOptions = {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
      };
      
      const refresh_token : string = await this.jwtService.signAsync(payload, jwtOptions);
      const cookieOptions: CookieOptions = {
          httpOnly: true,
          expires: expireIn,
          secure: true
      };
      
      res.cookie('refresh_token', refresh_token, cookieOptions);
      
      return {
        access_token: loginResponse.accessToken!,
        user: loginResponse.user
      };
    } catch (e) {
      throw e;
    }
  }

  @Post('login/2fa')
  @UseGuards(TwoFactorAuthGuard)
  @ApiOperation({ summary: 'Complete login with 2FA code' })
  @ApiResponse({ status: 200, description: 'Login with 2FA successful' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  @ApiResponse({ status: 401, description: 'Invalid or expired 2FA token' })
  async completeLoginWith2FA(
    @Body() complete2FADto: Complete2FADto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<SignInData> {
    try {
      const user = req['user'] as User;
      const loginResponse = await this.authService.complete2FAForUser(
        user,
        complete2FADto.twoFactorCode, 
        req
      );

      if (!loginResponse.user) {
        throw new Error('User should not be null in 2FA completion');
      }
      
      const expireIn: Date = new Date();
      expireIn.setMonth(expireIn.getMonth() + 3);
      
      const payload: JwtPayload = {
          sub: loginResponse.user.user_id,
          email: loginResponse.user.email
      };
      
      const jwtOptions: JwtSignOptions = {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
      };
      
      const refresh_token : string = await this.jwtService.signAsync(payload, jwtOptions);
      const cookieOptions: CookieOptions = {
          httpOnly: true,
          expires: expireIn,
          secure: true
      };
      
      res.cookie('refresh_token', refresh_token, cookieOptions);
      
      return {
        access_token: loginResponse.accessToken!,
        user: loginResponse.user
      };
    } catch (error) {
      console.error('2FA completion error:', error);
      throw error;
    }
  }

  @Post('2fa/setup')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup 2FA for user' })
  @ApiResponse({ status: 200, description: '2FA setup initiated' })
  @ApiResponse({ status: 400, description: '2FA already enabled' })
  async setup2FA(
    @Body() setup2FADto: Setup2FADto,
    @CurrentUser() user: User
  ) {
    try {
      console.log('2FA setup request for user:', user.user_id, 'method:', setup2FADto.method);
      console.log('User object:', JSON.stringify(user, null, 2));
      
      // Test database connection
      const testUser = await this.authService.findUserByEmail(user.email);
      console.log('Test user lookup:', testUser ? 'success' : 'failed');
      
      const result = await this.authService.setup2FA(user.user_id, setup2FADto.method);
      console.log('2FA setup successful for user:', user.user_id);
      return result;
    } catch (error) {
      console.error('2FA setup error:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  @Post('2fa/verify-setup')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify 2FA setup' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  async verify2FASetup(
    @Body() verify2FADto: Verify2FADto,
    @CurrentUser() user: User
  ) {
    return await this.authService.verify2FASetup(user.user_id, verify2FADto.code, verify2FADto.method);
  }

  @Post('2fa/disable')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA for a specific method' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid password or 2FA not enabled' })
  async disable2FA(
    @Body() disable2FADto: Disable2FADto,
    @CurrentUser() user: User
  ) {
    return await this.authService.disable2FA(user.user_id, disable2FADto.password, disable2FADto.method);
  }

  @Post('verify-2fa/backup')
  @UseGuards(TwoFactorAuthGuard)
  @ApiOperation({ 
    summary: 'Verify backup code during 2FA login',
    description: 'Use a backup code to complete 2FA authentication. This endpoint requires a valid 2FA pre-auth token obtained from the login endpoint.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Backup code verified successfully, login completed',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', description: 'JWT access token for authenticated session' },
        user: { 
          type: 'object',
          description: 'User information',
          properties: {
            user_id: { type: 'string' },
            email: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            is_verified: { type: 'boolean' },
            is_active: { type: 'boolean' },
            twoFactorAuthenticatorEnabled: { type: 'boolean' },
            twoFactorEmailEnabled: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid backup code' })
  @ApiResponse({ status: 401, description: 'Invalid or expired 2FA token' })
  @ApiResponse({ status: 429, description: 'Too many failed attempts' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token - 2FA pre-auth token obtained from login endpoint',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  async verifyBackupCode(
    @Body() verifyBackupCodeDto: VerifyBackupCodeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<SignInData> {
    try {
      const user = req['user'] as User;
      const loginResponse = await this.authService.complete2FAWithBackupCode(
        req.headers.authorization?.split(' ')[1] || '',
        verifyBackupCodeDto.backupCode,
        req
      );

      if (!loginResponse.user) {
        throw new Error('User should not be null in backup code completion');
      }
      
      const expireIn: Date = new Date();
      expireIn.setMonth(expireIn.getMonth() + 3);
      
      const payload: JwtPayload = {
          sub: loginResponse.user.user_id,
          email: loginResponse.user.email
      };
      
      const jwtOptions: JwtSignOptions = {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
      };
      
      const refresh_token : string = await this.jwtService.signAsync(payload, jwtOptions);
      const cookieOptions: CookieOptions = {
          httpOnly: true,
          expires: expireIn,
          secure: true
      };
      
      res.cookie('refresh_token', refresh_token, cookieOptions);
      
      return {
        access_token: loginResponse.accessToken!,
        user: loginResponse.user
      };
    } catch (error) {
      console.error('Backup code verification error:', error);
      throw error;
    }
  }



  @Get('2fa/backup-codes')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current backup codes' })
  @ApiResponse({ status: 200, description: 'Backup codes retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No backup codes found' })
  async getBackupCodes(@CurrentUser() user: User) {
    const backupCodes = await this.userService.getBackupCodes(user.user_id);
    if (!backupCodes) {
      throw new NotFoundException('No backup codes found');
    }
    return { backupCodes };
  }

  @Post('2fa/send-email-code')
  @ApiOperation({ summary: 'Send 2FA code via email (on demand, once per login)' })
  @ApiResponse({ status: 200, description: '2FA email code sent' })
  @ApiResponse({ status: 400, description: 'Already sent or not eligible' })
  async send2FAEmailCode(@Body() body: { email: string }) {
    const { email } = body;
    // Only allow one send per login attempt (keyed by email)
    if (email2FAResendMap.get(email)) {
      throw new BadRequestException('2FA email code already sent for this login attempt');
    }
    // Find user and check eligibility
    const user = await this.authService.findUserByEmail(email);
    if (!user || !user.twoFactorEmailEnabled) {
      throw new BadRequestException('User does not have email 2FA enabled');
    }
    // Send code
    await this.authService.send2FAEmailCode(user);
    email2FAResendMap.set(email, true);
    // Optionally, set a timeout to clear the flag after some time (e.g., 10 min)
    setTimeout(() => email2FAResendMap.delete(email), 10 * 60 * 1000);
    return { message: '2FA email code sent' };
  }

  @Get('2fa/status')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current 2FA status' })
  @ApiResponse({ status: 200, description: '2FA status retrieved successfully' })
  async get2FAStatus(@CurrentUser() user: User) {
    return {
      twoFactorAuthenticatorEnabled: user.twoFactorAuthenticatorEnabled,
      twoFactorEmailEnabled: user.twoFactorEmailEnabled
    };
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(
    @CurrentUserRefresh() user: User,
    @Res({ passthrough: true }) res: Response
  ): Promise<SignInData> {
    // Generate new access token
    const newPayload: JwtPayload = {
        email: user.email,
        sub: user.user_id
    };
    
    const jwtSignOptions: JwtSignOptions = {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRATION'),
    };
    
    const accessToken = this.jwtService.sign(newPayload, jwtSignOptions);
    
    // Generate new refresh token
    const refreshPayload: JwtPayload = {
        sub: user.user_id,
        email: user.email
    };
    
    const refreshJwtOptions: JwtSignOptions = {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
    };
    
    const refresh_token: string = await this.jwtService.signAsync(refreshPayload, refreshJwtOptions);
    
    // Set cookie options
    const expireIn: Date = new Date();
    expireIn.setMonth(expireIn.getMonth() + 3);
    
    const cookieOptions: CookieOptions = {
        httpOnly: true,
        expires: expireIn,
        secure: true
    };
    
    res.cookie('refresh_token', refresh_token, cookieOptions);
    
    return {
      access_token: accessToken,
      user: user
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ message: string }> {
    await this.authService.logout(user.user_id);
    
    // Clear refresh token cookie
    res.clearCookie('refresh_token');
    
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.authService.transformUserToResponseDto(user);
  }

  @Get('tenant')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user\'s tenant information' })
  @ApiResponse({ status: 200, description: 'Tenant information retrieved' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenant(@CurrentUser() user: User): Promise<TenantResponseDto> {
    const tenant = await this.tenantService.findByUserId(user.user_id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found for this user');
    }
    return tenant;
  }

  @Get('staff')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user\'s staff information' })
  @ApiResponse({ status: 200, description: 'Staff information retrieved' })
  @ApiResponse({ status: 404, description: 'Staff record not found' })
  async getStaff(@CurrentUser() user: User): Promise<StaffResponseDto> {
    const tenant = await this.tenantService.findByUserId(user.user_id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found for this user');
    }
    
    const staff = await this.staffService.findByUserIdAndTenant(user.user_id, tenant.id);
    if (!staff) {
      throw new NotFoundException('Staff record not found for this user');
    }
    
    return staff;
  }

  @Get('user-data')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get complete user data including tenant and staff information' })
  @ApiResponse({ status: 200, description: 'Complete user data retrieved' })
  async getUserData(@CurrentUser() user: User): Promise<{
    user: UserResponseDto;
    tenant: TenantResponseDto;
    staff: StaffResponseDto;
  }> {
    const tenant = await this.tenantService.findByUserId(user.user_id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found for this user');
    }
    
    const staff = await this.staffService.findByUserIdAndTenant(user.user_id, tenant.id);
    if (!staff) {
      throw new NotFoundException('Staff record not found for this user');
    }
    
    return {
      user: this.authService.transformUserToResponseDto(user),
      tenant,
      staff
    };
  }

  /**
   * Example methods for handling password reset with database tokens
   * Add these to your existing auth controller
   */

  /**
   * Request password reset (sends email with database token)
   */
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
             const user = await this.authService.findUserByEmail(forgotPasswordDto.email);
      if (!user) {
          // Don't reveal if user exists or not
          return { message: 'If an account with this email exists, a password reset link has been sent.' };
      }

      await this.mailService.sendPasswordReset(user);
      return { message: 'If an account with this email exists, a password reset link has been sent.' };
  }

  /**
   * Reset password using database token
   */
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
             const { token, password } = resetPasswordDto;
      
      // Validate token using EmailTokenService
      const emailToken = await this.emailTokenService.validateToken(token, EmailTokenType.PASSWORD_RESET);
      if (!emailToken) {
          throw new UnauthorizedException('Invalid or expired reset token');
      }

             // Update user password (implement this in your auth service)
       await this.authService.updatePassword(emailToken.user.user_id, password);
      
      // Mark token as used
      await this.emailTokenService.markTokenAsUsed(token);
      
      return { message: 'Password reset successfully' };
  }

  /**
   * Validate reset token (for frontend validation)
   */
  @Post('validate-reset-token')
  async validateResetToken(@Body() body: { token: string }) {
      const emailToken = await this.emailTokenService.validateToken(body.token, EmailTokenType.PASSWORD_RESET);
      return { valid: !!emailToken };
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiResponse({ status: 200, description: 'Verification email sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async resendVerification(@Body() body: { email: string }) {
    return await this.authService.resendVerification(body.email);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() body: { token: string }) {
    return await this.authService.verifyEmail(body.token);
  }

  @Get('test-db')
  @ApiOperation({ summary: 'Test database connection' })
  async testDatabase() {
    try {
      const user = await this.authService.findUserByEmail('test@example.com');
      
      // Test 2FA fields
      const testUser = await this.authService.findUserByEmail('test@example.com');
      const has2FAFields = testUser && 
        'twoFactorAuthenticatorEnabled' in testUser && 
        'twoFactorEmailEnabled' in testUser;
      
      return { 
        success: true, 
        message: 'Database connection working',
        userFound: !!user,
        has2FAFields,
        userFields: testUser ? Object.keys(testUser) : []
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Database connection failed',
        error: error.message 
      };
    }
  }
}
