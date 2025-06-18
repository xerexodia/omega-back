import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from "./user.entity";

@Entity({ name: "ssh_keys" })
export class SSHKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column("text", { nullable: true })
  publicKey: string;

  @Column("text", { nullable: true })
  privateKey: string;

  @Column()
  lambdaId: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: "CASCADE" })
  user: User;
}
