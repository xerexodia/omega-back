import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import axios from "axios";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Filesystem } from "src/entities/filesystem.entity";
import { User } from "src/entities/user.entity";

@Injectable()
export class FilesystemService {
  private readonly baseUrl = "https://cloud.lambda.ai/api/v1";
  private readonly userName = process.env.LAMBDA_API_KEY;

  constructor(
    @InjectRepository(Filesystem)
    private readonly fsRepo: Repository<Filesystem>,
  ) {}

  async create(user: User, name: string, region: string) {
    try {
      const { data } = await axios.post(
        `${this.baseUrl}/filesystems`,
        {
          name,
          region,
        },
        {
          auth: {
            username: this.userName,
            password: "",
          },
        },
      );

      const filesystem = this.fsRepo.create({
        name,
        lambdaId: data.data.id,
        region,
        user,
      });

      await this.fsRepo.save(filesystem);
      return data.data;
    } catch (error) {
      console.error(
        "Error creating filesystem:",
        error?.response?.data || error,
      );
      throw new BadRequestException("Failed to create filesystem");
    }
  }

  async list(user: User) {
    try {
      const { data } = await axios.get(`${this.baseUrl}/file-systems`, {
        auth: {
          username: this.userName,
          password: "",
        },
      });
      console.log("🚀 ~ FilesystemService ~ list ~ data:", data);

      const allLambdaFilesystems = data.data;

      const localFilesystems = await this.fsRepo.find({
        where: { user: { id: user.id } },
      });

      const lambdaIds = localFilesystems.map((fs) => fs.lambdaId);

      const userFilesystems = allLambdaFilesystems.filter((fs: any) =>
        lambdaIds.includes(fs.id),
      );

      return userFilesystems;
    } catch (error) {
      console.error(
        "🚀 ~ FilesystemService ~ list ~ error:",
        error?.response?.data || error,
      );
      throw new InternalServerErrorException("Failed to list filesystems");
    }
  }

  async delete(id: string) {
    try {
      const fs = await this.fsRepo.findOne({
        where: { lambdaId: id },
        select: ["lambdaId", "id"],
      });

      if (!fs) throw new NotFoundException("Filesystem not found");

      await axios.delete(`${this.baseUrl}/filesystems/${fs.lambdaId}`, {
        auth: {
          username: this.userName,
          password: "",
        },
      });

      await this.fsRepo.delete({ id: fs.id });
    } catch (error) {
      console.error(
        "Error deleting filesystem:",
        error?.response?.data || error,
      );
      throw new BadRequestException("Failed to delete filesystem");
    }
  }
}
