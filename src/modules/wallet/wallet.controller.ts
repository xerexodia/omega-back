import {
  Controller,
  Post,
  Body,
  Get,
  BadRequestException,
  UseGuards,
  Request,
  InternalServerErrorException,
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
    // Input validation
    const { userId, to, amount } = body;

    if (!userId || !to || !amount) {
      throw new BadRequestException(
        "userId, recipient address, and amount are required"
      );
    }

    if (typeof userId !== "number" || userId <= 0) {
      throw new BadRequestException("Invalid user ID");
    }

    if (typeof amount !== "number" || amount <= 0) {
      throw new BadRequestException("Amount must be a positive number");
    }

    // Basic Solana address validation
    if (typeof to !== "string" || !to.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
      throw new BadRequestException("Invalid recipient address");
    }

    try {
      const signature = await this.walletService.withdrawSol(
        userId,
        to,
        amount
      );

      if (!signature) {
        throw new InternalServerErrorException(
          "Withdrawal failed - no transaction signature returned"
        );
      }

      return {
        success: true,
        message: "Withdrawal initiated successfully",
        signature,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Handle specific errors from walletService
      if (error instanceof Error) {
        if (error.message.includes("insufficient funds")) {
          throw new BadRequestException("Insufficient funds for withdrawal");
        }
        if (error.message.includes("invalid account")) {
          throw new BadRequestException("Invalid recipient address");
        }
      }

      // Log the error for debugging
      console.error(`Withdrawal failed for user ${userId}:`, error);
      throw new InternalServerErrorException("Withdrawal processing failed");
    }
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
