// src/instance/dto/launch-instance.dto.ts
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class TagDto {
  @IsString()
  key: string;

  @IsString()
  value: string;
}

class FileSystemMountDto {
  @IsString()
  file_system_name: string;

  @IsString()
  mount_path: string;
}

export class LaunchInstanceDto {
  @IsString()
  region_name: string;

  @IsString()
  instance_type_name: string;

  @IsArray()
  @IsString({ each: true })
  ssh_key_names: string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FileSystemMountDto)
  file_system_mounts?: FileSystemMountDto[];

  @IsOptional()
  @IsString()
  hostname?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  user_data?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TagDto)
  tags?: TagDto[];
}


export interface InstanceType {
  name: string;
  vcpus: number;
  memory_gb: number;
  gpu: string | null;
  gpu_count: number;
  price_per_hour_usd: number;
  regions: string[];
}

export interface InstanceTypesResponse {
  data: InstanceType[];
}