import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  publicKey: string;

  @Column()
  privateKey: string;

  @Column()
  mnemonic: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}