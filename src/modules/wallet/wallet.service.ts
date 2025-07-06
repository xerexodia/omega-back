import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as bs58 from "bs58";
import * as bip39 from "bip39";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Wallet } from "src/entities/wallet.entity";
import { User } from "src/entities/user.entity";
import { EncryptionService } from "./encryption.service";

@Injectable()
export class WalletService {
  private readonly solanaConnection: Connection;

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly encryptionService: EncryptionService
  ) {
    this.solanaConnection = new Connection(
      process.env.SOLANA_RPC_URL,
      "confirmed"
    );
  }

  async createWallet(userId: number): Promise<Wallet> {
    const user = await this.findUserById(userId);

    const existingWallet = await this.walletRepository.findOne({
      where: { user: { id: userId } },
    });

    if (existingWallet) {
      return existingWallet;
    }

    const mnemonic = bip39.generateMnemonic();
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));

    const encryptionKey = this.encryptionService.deriveKeyFromPassword(
      user.email
    );
    const encryptedMnemonic = this.encryptionService.encrypt(
      mnemonic,
      encryptionKey
    );

    const wallet = this.walletRepository.create({
      user,
      publicKey: keypair.publicKey.toBase58(),
      privateKey: bs58.default.encode(keypair.secretKey),
      mnemonic: encryptedMnemonic,
    });

    return this.walletRepository.save(wallet);
  }

  async getDecryptedMnemonic(user: User): Promise<string> {
    const wallet = await this.findWalletByUserId(user.id);
    const encryptionKey = this.encryptionService.deriveKeyFromPassword(
      user.email
    );

    try {
      return this.encryptionService.decrypt(wallet.mnemonic, encryptionKey);
    } catch {
      throw new UnauthorizedException(
        "Incorrect password for mnemonic decryption"
      );
    }
  }

  async getBalance(userId: number): Promise<number> {
    const wallet = await this.findWalletByUserId(userId);
    const publicKey = new PublicKey(wallet.publicKey);
    const lamports = await this.solanaConnection.getBalance(publicKey);
    return lamports / LAMPORTS_PER_SOL;
  }

  async sendSol(
    userId: number,
    recipientAddress: string,
    amount: number
  ): Promise<string> {
    return this.transferSol(userId, recipientAddress, amount);
  }

  async withdrawSol(
    userId: number,
    recipientAddress: string,
    amount: number
  ): Promise<string> {
    return this.transferSol(userId, recipientAddress, amount);
  }

  /**
   * Transfer SOL from user's wallet to a recipient address
   */
  private async transferSol(
    userId: number,
    recipientAddress: string,
    amount: number
  ): Promise<string> {
    if (amount <= 0) {
      throw new BadRequestException("Amount must be greater than 0");
    }

    const wallet = await this.findWalletByUserId(userId);
    const senderPubKey = new PublicKey(wallet.publicKey);

    let recipientPubKey: PublicKey;
    try {
      recipientPubKey = new PublicKey(recipientAddress);
    } catch {
      throw new BadRequestException("Invalid recipient address");
    }

    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderPubKey,
        toPubkey: recipientPubKey,
        lamports,
      })
    );

    const { blockhash } = await this.solanaConnection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderPubKey;

    const keypair = Keypair.fromSecretKey(
      bs58.default.decode(wallet.privateKey)
    );
    transaction.sign(keypair);

    const rawTransaction = transaction.serialize();
    const signature =
      await this.solanaConnection.sendRawTransaction(rawTransaction);
    await this.solanaConnection.confirmTransaction(signature, "confirmed");

    return signature;
  }

  /**
   * (For devnet/testing) Request airdrop to simulate deposit
   */
  async requestAirdrop(userId: number, amount: number): Promise<string> {
    const wallet = await this.findWalletByUserId(userId);
    const publicKey = new PublicKey(wallet.publicKey);

    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
    const signature = await this.solanaConnection.requestAirdrop(
      publicKey,
      lamports
    );
    await this.solanaConnection.confirmTransaction(signature, "confirmed");

    return signature;
  }

  // -- Private Helpers --

  private async findWalletByUserId(userId: number): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { user: { id: userId } },
      relations: ["user"],
    });

    if (!wallet) {
      throw new NotFoundException("Wallet not found for this user");
    }

    return wallet;
  }

  private async findUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async depositSol(userId: number, amount: number): Promise<string> {
  if (amount <= 0) {
    throw new BadRequestException("Amount must be greater than 0");
  }

  const wallet = await this.findWalletByUserId(userId);
  const recipientPubKey = new PublicKey(wallet.publicKey);

  const serviceWalletSecret = process.env.SERVICE_WALLET_SECRET; 
  if (!serviceWalletSecret) {
    throw new Error("Missing SERVICE_WALLET_SECRET in env");
  }

  const serviceKeypair = Keypair.fromSecretKey(bs58.default.decode(serviceWalletSecret));
  const senderPubKey = serviceKeypair.publicKey;

  const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: senderPubKey,
      toPubkey: recipientPubKey,
      lamports,
    })
  );

  const { blockhash } = await this.solanaConnection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = senderPubKey;

  transaction.sign(serviceKeypair);

  const rawTransaction = transaction.serialize();
  const signature = await this.solanaConnection.sendRawTransaction(rawTransaction);
  await this.solanaConnection.confirmTransaction(signature, "confirmed");

  return signature;
}

}
