import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { User } from "src/entities/user.entity";
import { JwtModule } from "@nestjs/jwt";
import { MailService } from "../mail/mail.service";
import { WalletService } from "../wallet/wallet.service";
import { Wallet } from "src/entities/wallet.entity";
import { EncryptionService } from "../wallet/encryption.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Wallet]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_KEY,
        signOptions: { expiresIn: `365d` },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailService, WalletService, EncryptionService],
})
export class AuthModule {}
