// src/instance/instance.service.ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import axios from "axios";
import { Instance } from "src/entities/instance.entity";
import { User } from "src/entities/user.entity";
import { InstanceType, LaunchInstanceDto } from "./dto";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WalletService } from "../wallet/wallet.service";

@Injectable()
export class InstanceService {
  private readonly token = process.env.LAMBDA_API_KEY;
  private readonly YOUR_SERVICE_WALLET_ADDRESS =
    process.env.YOUR_SERVICE_WALLET_ADDRESS;

  constructor(
    @InjectRepository(Instance)
    private readonly instanceRepository: Repository<Instance>,
    private readonly walletService: WalletService
  ) {}

  async launchInstance(user: User, dto: LaunchInstanceDto): Promise<any> {
    const lambdaPayload = {
      ...dto,
      image: dto.image ? { id: dto.image } : undefined,
    };

    const types = await this.listInstanceTypes();
    const costInCents =
      types?.[dto.instance_type_name]?.instance_type?.price_cents_per_hour;

    const { sol } = await this.getHourlyCostInSOL(costInCents);
    const balance = await this.walletService.getBalance(user.id);

    if (balance < sol) {
      throw new Error("Insufficient funds in wallet");
    }

    await this.walletService.withdrawSol(
      user.id,
      this.YOUR_SERVICE_WALLET_ADDRESS,
      sol
    );

    let instanceId: string;

    try {
      const { data } = await axios.post(
        "https://cloud.lambda.ai/api/v1/instance-operations/launch",
        lambdaPayload,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      instanceId = data?.data?.instance_ids?.[0];
      if (!instanceId) {
        throw new Error("No instance ID returned from Lambda API");
      }
    } catch (error) {
      // await this.walletService.depositSol(user.id, sol);
      throw new Error(
        `Failed to launch instance. Funds refunded. Reason: ${error.message}`
      );
    }

    // Step 3: Save to DB
    const savedInstance = this.instanceRepository.create({
      cloud_id: instanceId,
      user,
      name: dto.name,
      hostname: dto.hostname,
      region_name: dto.region_name,
      instance_type: dto.instance_type_name,
      status: "running",
      image_id: dto.image,
      ssh_key_names: dto.ssh_key_names,
      tags: this.convertTagsArrayToObject(dto.tags),
      launched_at: new Date(),
      hourly_cost: costInCents,
      last_billed_at: new Date(),
    });

    return await this.instanceRepository.save(savedInstance);
  }

  async listInstanceTypes(): Promise<InstanceType[]> {
    try {
      const { data } = await axios.get(
        "https://cloud.lambda.ai/api/v1/instance-types",
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );
      return data.data;
    } catch (error: any) {
      console.error(
        "Error fetching instance types:",
        error.response?.data || error.message
      );
      throw new Error("Failed to fetch instance types");
    }
  }

  private async getHourlyCostInSOL(
    priceCents: number
  ): Promise<{ sol: number; lamports: number }> {
    const priceUSD = priceCents / 100;
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    const json = await res.json();
    const solUsdRate = json.solana.usd as number;
    const sol = priceUSD / solUsdRate;
    const lamports = Math.round(sol * LAMPORTS_PER_SOL);
    return { sol, lamports };
  }

  async listInstances(userId: string): Promise<Instance[]> {
    try {
      const { data } = await axios.get(
        `https://cloud.lambda.ai/api/v1/instances`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      const localinstances = await this.instanceRepository.find({
        where: { user: { id: Number(userId) } },
      });

      const lambdaIds = localinstances.map((fs) => fs.cloud_id);

      const userInstances = data.data.filter((fs: any) =>
        lambdaIds.includes(fs.id)
      );

      return userInstances;
    } catch (error: any) {
      console.error(
        "❌ Error fetching instances:",
        error.response?.data || error.message
      );
      throw new Error("Failed to fetch instances");
    }
  }

  async terminateInstance(userId: string, ids: string[]): Promise<any> {
    try {
      const { data } = await axios.post(
        "https://cloud.lambda.ai/api/v1/instance-operations/terminate",
        { instance_ids: ids },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      await this.instanceRepository
        .createQueryBuilder()
        .delete()
        .from(Instance)
        .where("cloud_id IN (:...ids)", { ids: ids })
        .andWhere("userId = :userId", { userId: Number(userId) })
        .execute();

      return data.data;
    } catch (error: any) {
      console.error(
        "❌ Error terminating instances:",
        error.response?.data || error.message
      );
      throw new Error("Failed to terminate instances");
    }
  }

  private convertTagsArrayToObject(
    tags: { key: string; value: string }[] = []
  ) {
    return tags.reduce((acc, tag) => {
      acc[tag.key] = tag.value;
      return acc;
    }, {});
  }
}
