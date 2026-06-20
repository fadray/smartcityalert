import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('pending_images')
export class PendingImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  from_number: string;

  @Column()
  media_url: string;

  @Column({ nullable: true })
  media_type: string;

  @Column({ nullable: true })
  profile_name: string;

  @Column({ nullable: true })
  image_path: string;

  @Column({ default: false })
  processed: boolean;

  @Column({ default: false })
  expired: boolean;

  @CreateDateColumn()
  created_at: Date;
}
