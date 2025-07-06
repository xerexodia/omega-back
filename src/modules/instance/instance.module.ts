import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Instance } from "src/entities/instance.entity";
import { InstanceService } from "./instance.service";
import { InstanceController } from "./instance.controller";
import { WalletService } from "../wallet/wallet.service";
import { User } from "src/entities/user.entity";
import { EncryptionService } from "../wallet/encryption.service";
import { Wallet } from "src/entities/wallet.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Instance,User,Wallet])],
  providers: [InstanceService,WalletService,EncryptionService],
  controllers: [InstanceController],
})
export class InstanceModule {}
