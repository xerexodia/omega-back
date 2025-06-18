// src/instance/instance.service.ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import axios from "axios";
import { Instance } from "src/entities/instance.entity";
import { User } from "src/entities/user.entity";
import { InstanceType, LaunchInstanceDto } from "./dto";

@Injectable()
export class InstanceService {
  private readonly token = process.env.LAMBDA_API_KEY;

  constructor(
    @InjectRepository(Instance)
    private readonly instanceRepository: Repository<Instance>
  ) {}

  async launchInstance(user: User, dto: LaunchInstanceDto): Promise<Instance> {
    const lambdaPayload = {
      ...dto,
      image: dto.image ? { id: dto.image } : undefined,
    };

    const { data } = await axios.post(
      "https://cloud.lambda.ai/api/v1/instance-operations/launch",
      lambdaPayload,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    const savedInstance = this.instanceRepository.create({
      cloud_id: data.data.instance_ids[0],
      user,
      name: dto.name,
      hostname: dto.hostname,
      region_name: dto.region_name,
      instance_type: dto.instance_type_name,
      status: "pending",
      image_id: dto.image,
      ssh_key_names: dto.ssh_key_names,
      tags: this.convertTagsArrayToObject(dto.tags),
      launched_at: new Date(),
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
