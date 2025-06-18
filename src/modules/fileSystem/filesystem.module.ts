import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FilesystemService } from "./filesystem.service";
import { FilesystemController } from "./filesystem.controller";
import { Filesystem } from "src/entities/filesystem.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Filesystem])],
  providers: [FilesystemService],
  controllers: [FilesystemController],
})
export class FileSystemModule {}
