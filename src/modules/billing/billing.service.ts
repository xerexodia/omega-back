// import {
//   Injectable,
//   Logger,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// // import { Cron, CronExpression } from '@nestjs/schedule';
// // import { Instance } from '../entities/instance.entity';
// // import { SolanaService } from './solana.service';
// import { LAMPORTS_PER_SOL } from '@solana/web3.js';

// @Injectable()
// export class BillingService {
//   private readonly logger = new Logger(BillingService.name);
//   private readonly serviceWalletAddress = process.env.SERVICE_WALLET_ADDRESS;

//   constructor(
//     @InjectRepository(Instance)
//     private readonly instanceRepository: Repository<Instance>,
//     private readonly solanaService: SolanaService
//   ) {}

//   @Cron(CronExpression.EVERY_HOUR)
//   async handleBilling() {
//     const runningInstances = await this.instanceRepository.find({
//       where: { status: 'running' },
//       relations: ['user', 'user.wallet']
//     });

//     const now = new Date();
//     const oneHour = 60 * 60 * 1000;

//     for (const instance of runningInstances) {
//       if (!instance.last_billed_at) {
//         instance.last_billed_at = now;
//         await this.instanceRepository.save(instance);
//         continue;
//       }

//       const hoursElapsed = Math.floor(
//         (now.getTime() - instance.last_billed_at.getTime()) / oneHour
//       );

//       if (hoursElapsed <= 0) continue;

//       const costInSol = (instance.hourly_cost / 100) / LAMPORTS_PER_SOL;
//       const totalCostInSol = costInSol * hoursElapsed;

//       try {
//         const balance = await this.solanaService.getBalance(instance.user.wallet.publicKey);

//         if (balance < totalCostInSol) {
//           this.logger.warn(
//             `Instance ${instance.id} stopped due to insufficient balance. Required: ${totalCostInSol}, Available: ${balance}`
//           );
//           await this.stopInstance(instance);
//           instance.status = 'stopped';
//           await this.instanceRepository.save(instance);
//           continue;
//         }

//         // Perform hourly billing (one transaction for all elapsed hours)
//         await this.solanaService.transfer(
//           instance.user.wallet.privateKey,
//           this.serviceWalletAddress,
//           totalCostInSol
//         );

//         // Update billing timestamp
//         instance.last_billed_at = new Date(
//           instance.last_billed_at.getTime() + (oneHour * hoursElapsed)
//         );

//         await this.instanceRepository.save(instance);
//         this.logger.log(
//           `Billed instance ${instance.id} for ${hoursElapsed} hour(s). Charged: ${totalCostInSol} SOL`
//         );
//       } catch (error) {
//         this.logger.error(`Billing failed for instance ${instance.id}:`, error);
//       }
//     }
//   }

//   private async stopInstance(instance: Instance) {
//     // Call your cloud API to stop the instance here
//     this.logger.log(`Stopping instance ${instance.id}...`);
//     // Example:
//     // await axios.post(`https://your-cloud-api.com/stop/${instance.cloud_id}`);
//   }
// }
