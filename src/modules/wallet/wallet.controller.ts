import {
  Controller,
  Post,
  Body,
  Get,
  BadRequestException,
  UseGuards,
  Request,
} from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { ScopesGuard } from "../auth/authGuard.service";

@UseGuards(ScopesGuard)
@Controller("wallet")
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post("create")
  async createWallet(@Request() req) {
    if (!req.user) {
      throw new BadRequestException("userId and password are required");
    }
    return this.walletService.createWallet(req.user);
  }

  @Post("mnemonic")
  async getMnemonic(@Request() req) {
    if (!req.user) {
      throw new BadRequestException("userId and password are required");
    }
    return this.walletService.getDecryptedMnemonic(req.user);
  }

  @Get("balance")
  async getBalance(@Request() req) {
    const id = parseInt(req.user.id, 10);
    if (isNaN(id)) {
      throw new BadRequestException("Invalid userId");
    }
    return { balance: await this.walletService.getBalance(id) };
  }

  @Post("send")
  async sendSol(@Body() body: { userId: number; to: string; amount: number }) {
    const { userId, to, amount } = body;
    if (!userId || !to || !amount) {
      throw new BadRequestException("userId, to, and amount are required");
    }
    return { signature: await this.walletService.sendSol(userId, to, amount) };
  }

  @Post("withdraw")
  async withdrawSol(
    @Body() body: { userId: number; to: string; amount: number }
  ) {
    const { userId, to, amount } = body;
    if (!userId || !to || !amount) {
      throw new BadRequestException("userId, to, and amount are required");
    }
    return {
      signature: await this.walletService.withdrawSol(userId, to, amount),
    };
  }

  @Post("airdrop")
  async requestAirdrop(@Body() body: { userId: number; amount: number }) {
    const { userId, amount } = body;
    if (!userId || !amount) {
      throw new BadRequestException("userId and amount are required");
    }
    return {
      signature: await this.walletService.requestAirdrop(userId, amount),
    };
  }
}
