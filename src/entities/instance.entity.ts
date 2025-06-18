// instance.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Instance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  cloud_id: string;

  @ManyToOne(() => User, user => user.instance, { eager: true })
  user: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  hostname: string;

  @Column()
  region_name: string;

  @Column()
  instance_type: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'running' | 'stopped' | 'terminated';

  @Column({ nullable: true })
  image_id: string;

  @Column('simple-array')
  ssh_key_names: string[];

  @Column('jsonb', { nullable: true })
  tags: Record<string, string>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  launched_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  terminated_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
