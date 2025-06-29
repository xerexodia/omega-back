import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import { SSHKey } from "./ssh.entity";
import { Filesystem } from "./filesystem.entity";
import { Instance } from "./instance.entity";
import { Wallet } from "./wallet.entity";

@Entity({ name: "user" })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  token: string;

  @Column({ nullable: true })
  otp: string;

  @Column({ nullable: true })
  otpExpiresAt: Date;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => SSHKey, (key) => key.id, { onDelete: "CASCADE" })
  sshkey: SSHKey;

  @OneToMany(() => Filesystem, (key) => key.id, { onDelete: "CASCADE" })
  filesystem: Filesystem;

  @OneToMany(() => Instance, (key) => key.id, { onDelete: "CASCADE" })
  instance: Instance;

  @OneToOne(() => Wallet, (key) => key, { onDelete: "CASCADE" })
  wallet: Wallet;
}
