import { Module } from "@nestjs/common";
import { WalletController } from "./wallet.controller";
import { WalletService } from "./wallet.service";
import { EncryptionService } from "./encryption.service";
import { User } from "src/entities/user.entity";
import { Wallet } from "src/entities/wallet.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  controllers: [WalletController],
  providers: [WalletService, EncryptionService],
  imports: [TypeOrmModule.forFeature([User, Wallet])],
})
export class WalletModule {}
