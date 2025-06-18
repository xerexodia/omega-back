import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from "@nestjs/common";
import { InstanceService } from "./instance.service";
import { LaunchInstanceDto } from "./dto";
import { ScopesGuard } from "../auth/authGuard.service";

@Controller("instance")
@UseGuards(ScopesGuard)
export class InstanceController {
  constructor(private readonly instanceService: InstanceService) {}

  @Post("launch")
  async launch(@Body() dto: LaunchInstanceDto, @Request() req) {
    const user = req.user;
    return this.instanceService.launchInstance(user, dto);
  }

  @Post("terminate")
  async terminate(@Body() payload: { ids: string[] }, @Request() req) {
    const user = req.user;
    return this.instanceService.terminateInstance(user.id, payload.ids);
  }

  @Get("instance-types")
  async getInstanceTypes() {
    return this.instanceService.listInstanceTypes();
  }

  @Get("")
  async getInstances(@Request() req) {
    return this.instanceService.listInstances(req.user.id);
  }
}
