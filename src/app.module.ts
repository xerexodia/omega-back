import { Module, OnApplicationBootstrap } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppConfig, DbConfig } from "./config";
import { AuthModule } from "./modules/auth/auth.module";
import { User } from "./entities/user.entity";
import { StorageModule } from "./modules/storage/storage.module";
import { STORAGE_CONFIG } from "./constants/storage.constats";
import { ServeStaticModule } from "@nestjs/serve-static";
import { JwtStrategy } from "./modules/auth/JwtTrategy";
import { SeederService } from "./modules/seeder/seeder.service";
import { SeederModule } from "./modules/seeder/seeder.module";
import { MailModule } from "./modules/mail/mail.module";
import { SSHKeyModule } from "./modules/sshKeys/ssh-key.module";
import { SSHKey } from "./entities/ssh.entity";
import { Filesystem } from "./entities/filesystem.entity";
import { FileSystemModule } from "./modules/fileSystem/filesystem.module";
import { InstanceModule } from "./modules/instance/instance.module";
import { Instance } from "./entities/instance.entity";
import { WalletModule } from "./modules/wallet/wallet.module";
import { Wallet } from "./entities/wallet.entity";
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [AppConfig, DbConfig],
      envFilePath: [`.env`],
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (ConfigService: ConfigService) => {
        return {
          ...ConfigService.get("database"),
        };
      },
    }),

    TypeOrmModule.forFeature([User, SSHKey, Filesystem, Instance, Wallet]),

    ServeStaticModule.forRoot({
      rootPath: STORAGE_CONFIG.LOCAL_STORAGE_PATH,
      serveRoot: "/static",
    }),

    AuthModule,
    MailModule,
    StorageModule,
    SeederModule,
    SSHKeyModule,
    InstanceModule,
    FileSystemModule,
    WalletModule,
  ],

  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly seederService: SeederService) {}

  async onApplicationBootstrap() {
    await this.seederService.seedData();
  }
}
