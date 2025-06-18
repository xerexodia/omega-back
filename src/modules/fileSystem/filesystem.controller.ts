import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
} from "@nestjs/common";
import { FilesystemService } from "./filesystem.service";
import { ScopesGuard } from "../auth/authGuard.service";

@UseGuards(ScopesGuard)
@Controller("filesystems")
export class FilesystemController {
  constructor(private readonly filesystemService: FilesystemService) {}

  @Post()
  async create(
    @Request() req,
    @Body("name") name: string,
    @Body("region") region: string
  ) {
    return this.filesystemService.create(req.user, name, region);
  }

  @Get()
  async list(@Request() req) {
    return this.filesystemService.list(req.user);
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    return this.filesystemService.delete(id);
  }
}
