import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "src/entities/user.entity";
import { LoginDto, SignupDto, VerifyOtpDto } from "./authDTO";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import { MailService } from "../mail/mail.service";
import { WalletService } from "../wallet/wallet.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly walletService: WalletService
  ) {}

  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private async sendOtpEmail(email: string, otp: string): Promise<void> {
    await this.mailService.sendMail({
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
      html: `<p>Your OTP code is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`,
    });
  }

  async signup(signupDto: SignupDto): Promise<{ message: string }> {
    const { email } = signupDto;

    const existingEmail = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException("Email already registered");
    }

    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = this.usersRepository.create({
      email,
      otp,
      otpExpiresAt,
      isVerified: false,
    });

    await this.usersRepository.save(user);
    await this.sendOtpEmail(email, otp);

    return {
      message:
        "OTP sent to your email. Please verify to complete registration.",
    };
  }

  async checkUserName(
    username: string,
    email: string
  ): Promise<{ available: boolean; message?: string }> {
    try {
      if (!username) {
        throw new BadRequestException("Username cannot be empty");
      }

      const existingUser = await this.usersRepository.findOne({
        where: { username },
        select: ["id"],
      });
      const currentUser = await this.usersRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        return {
          available: false,
          message: "Username already taken",
        };
      }
      currentUser.username = username;
      await this.usersRepository.save(currentUser);
      return {
        available: true,
        message: "Username is available",
      };
    } catch (error) {
      console.error("Error checking username:", error);
      throw error;
    }
  }
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<Partial<User>> {
    const { email, otp } = verifyOtpDto;

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.isVerified) {
      throw new BadRequestException("User already verified");
    }

    if (user.otp !== otp) {
      throw new UnauthorizedException("Invalid OTP");
    }

    if (user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException("OTP expired");
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;

    const token = this.jwtService.sign({ id: user.id, email: user.email });
    user.token = token;

    await this.usersRepository.save(user);

    return user;
  }

  async loginWithPassword(loginDto: LoginDto): Promise<Omit<User, "password">> {
    const { email } = loginDto;

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (!user.isVerified) {
      throw new UnauthorizedException("Please verify your account first");
    }

    const token = this.jwtService.sign({ id: user.id, email: user.email });
    await this.usersRepository.update(user.id, { token });

    return { ...user, token };
  }

  async initiateOtpLogin(email: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException("Email not registered");
    }

    if (!user.isVerified) {
      throw new UnauthorizedException("Please verify your account first");
    }

    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersRepository.update(user.id, { otp, otpExpiresAt });
    await this.sendOtpEmail(email, otp);

    return { message: "OTP sent to your email. Please verify to login." };
  }

  async verifyOtpLogin(
    verifyOtpDto: VerifyOtpDto
  ): Promise<Omit<User, "password">> {
    const { email, otp } = verifyOtpDto;

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.otp !== otp) {
      throw new UnauthorizedException("Invalid OTP");
    }

    if (user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException("OTP expired");
    }

    const token = this.jwtService.sign({ id: user.id, email: user.email });
    await this.usersRepository.update(user.id, {
      token,
      otp: null,
      otpExpiresAt: null,
    });

    const updatedUser = await this.usersRepository.findOne({
      where: { id: user.id },
    });
    if (!updatedUser) throw new UnauthorizedException("Login failed");

    return updatedUser;
  }

  async getAuthenticatedUser(userId: number): Promise<Partial<User>> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      let wallet = user.wallet;
      if (!wallet) {
        wallet = await this.walletService.createWallet(user.id);
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        token: user.token,
        isVerified: user.isVerified,
        //@ts-ignore
        wallet: {
          publicKey: wallet.publicKey,
        },
      };
    } catch (error) {
      console.error(error);
    }
  }
}
