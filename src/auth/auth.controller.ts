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
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TwoFactorMethod } from 'src/user/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { EmailTokenType } from 'src/database/entities/email-token.entity';
import { EmailTokenService } from 'src/mail/email-token.service';
import { MailService } from 'src/mail/mail.service';


interface TwoFactorRequiredResponse {
  access_token: null;
  user: null;
  requires2FA: true;
  twoFactorMethod: TwoFactorMethod;
}

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

    private readonly mailService: MailService,
    private readonly emailTokenService: EmailTokenService
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
      
      // If 2FA is required, return early
      if (loginResponse.requires2FA) {
        return {
          access_token: null,
          user: null,
          requires2FA: true,
          twoFactorMethod: loginResponse.twoFactorMethod || TwoFactorMethod.NONE
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
  @ApiOperation({ summary: 'Complete login with 2FA code' })
  @ApiResponse({ status: 200, description: 'Login with 2FA successful' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  async completeLoginWith2FA(
    @Body() body: { email: string; twoFactorCode: string },
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ): Promise<SignInData> {
    const loginResponse = await this.authService.completeLoginWith2FA(
      body.email, 
      body.twoFactorCode, 
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
    return await this.authService.setup2FA(user.user_id, setup2FADto.method);
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
    return await this.authService.verify2FASetup(user.user_id, verify2FADto.code);
  }

  @Post('2fa/disable')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid code or password' })
  async disable2FA(
    @Body() disable2FADto: Disable2FADto,
    @CurrentUser() user: User
  ) {
    return await this.authService.disable2FA(
      user.user_id, 
      disable2FADto.code, 
      disable2FADto.password
    );
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(
    @Body() body: { refreshToken: string },
    @Res({ passthrough: true }) res: Response
  ): Promise<SignInData> {
    const loginResponse = await this.authService.refreshToken(body.refreshToken);

    if (!loginResponse.user) {
      throw new Error('User should not be null in token refresh');
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
  async getProfile(@CurrentUser() user: User): Promise<User> {
    return user;
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
}
