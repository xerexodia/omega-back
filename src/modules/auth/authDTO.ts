import { IsNotEmpty } from "class-validator";

export class SignupDto {
  @IsNotEmpty({ message: "Email is required" })
  email: string;
}

export class LoginDto {
  @IsNotEmpty({ message: "Email is required" })
  email: string;
}

export class VerifyOtpDto {
  @IsNotEmpty({ message: "Email is required" })
  email: string;
  @IsNotEmpty({ message: "OTP is required" })
  otp: string;
}

export class InitiateOtpLoginDto {
  @IsNotEmpty({ message: "Email is required" })
  email: string;
}
