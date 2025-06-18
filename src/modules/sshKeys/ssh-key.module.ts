import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SSHKeyService } from "./ssh-key.service";
import { SSHKey } from "src/entities/ssh.entity";
import { SSHKeyController } from "./ssh-key.controller";

@Module({
  imports: [TypeOrmModule.forFeature([SSHKey])],
  providers: [SSHKeyService],
  controllers: [SSHKeyController],
})
export class SSHKeyModule {}
