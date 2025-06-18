import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Req,
  Get,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  SignupDto,
  LoginDto,
  VerifyOtpDto,
  InitiateOtpLoginDto,
} from "./authDTO";
import { ScopesGuard } from "./authGuard.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post("verify-otp")
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    return this.authService.loginWithPassword(loginDto);
  }

  @Post("initiate-otp-login")
  async initiateOtpLogin(@Body() initiateOtpLoginDto: InitiateOtpLoginDto) {
    return this.authService.initiateOtpLogin(initiateOtpLoginDto.email);
  }

  @Post("verify-otp-login")
  async verifyOtpLogin(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtpLogin(verifyOtpDto);
  }

  @Post("check-username")
  async checkUsernameAvailability(@Body() { username, email }) {
    try {
      return await this.authService.checkUserName(username, email);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("Error checking username availability");
    }
  }
  @UseGuards(ScopesGuard)
  @Get("me")
  async getAuthenticatedUser(@Req() req: any) {
    try {
      const userId = req.user.id;
      return await this.authService.getAuthenticatedUser(userId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("Error checking username availability");
    }
  }
}
