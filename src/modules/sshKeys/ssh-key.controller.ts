import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from "@nestjs/common";
import { SSHKeyService } from "./ssh-key.service";
import { ScopesGuard } from "../auth/authGuard.service";

@UseGuards(ScopesGuard)
@Controller("ssh-keys")
export class SSHKeyController {
  constructor(private readonly sshKeyService: SSHKeyService) {}

  @Post()
  async create(@Request() req, @Body("name") name: string) {
    return this.sshKeyService.createKey(req.user, name);
  }

  @Get()
  async list(@Request() req) {
    return this.sshKeyService.listKeys(req.user.id);
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    return this.sshKeyService.deleteKey(id);
  }
}
