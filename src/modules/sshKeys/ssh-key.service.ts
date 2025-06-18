import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import axios from "axios";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SSHKey } from "src/entities/ssh.entity";
import { User } from "src/entities/user.entity";

@Injectable()
export class SSHKeyService {
  private readonly baseUrl = "https://cloud.lambda.ai/api/v1";
  private readonly token = process.env.LAMBDA_API_KEY;

  constructor(
    @InjectRepository(SSHKey)
    private readonly sshKeyRepo: Repository<SSHKey>
  ) {}

  async createKey(user: User, name: string) {
    try {
      const { data } = await axios.post(
        `${this.baseUrl}/ssh-keys`,
        { name },
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );

      const sshKey = this.sshKeyRepo.create({
        name,
        publicKey: data.data.public_key,
        privateKey: data.data.private_key,
        lambdaId: data.data.id,
        user,
      });

      return await this.sshKeyRepo.save(sshKey);
    } catch (error) {
      console.error("Error creating SSH key:", error?.response?.data || error);
      throw new BadRequestException(
        error?.response?.data?.message || "Failed to create SSH key"
      );
    }
  }

  async listKeys(userId: string) {
    try {
      return await this.sshKeyRepo.find({
        where: { user: { id: Number(userId) } },
        select: ["id", "name", "publicKey"],
      });
    } catch (error) {
      console.error("Error listing SSH keys:", error);
      throw new InternalServerErrorException("Could not retrieve SSH keys");
    }
  }

  async deleteKey(id: string) {
    try {
      const sshKey = await this.sshKeyRepo.findOne({
        where: { id: Number(id) },
        select: ["lambdaId"],
      });

      if (!sshKey) {
        throw new NotFoundException("SSH key not found");
      }

      await axios.delete(`${this.baseUrl}/ssh-keys/${sshKey.lambdaId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      await this.sshKeyRepo.delete({ id: Number(id) });
    } catch (error) {
      console.error("Error deleting SSH key:", error?.response?.data || error);
      throw new BadRequestException(
        error?.response?.data?.message || "Failed to delete SSH key"
      );
    }
  }
}
