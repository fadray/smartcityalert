import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('pending_images')
export class PendingImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'from_number' })
  from_number: string;

  @Column({ name: 'media_url' })
  media_url: string;

  @Column({ name: 'media_type', nullable: true })
  media_type: string;

  @Column({ name: 'profile_name', nullable: true })
  profile_name: string;

  @Column({ name: 'image_path', nullable: true })
  image_path: string;

  @Column({ default: false })
  processed: boolean;

  @Column({ default: false })
  expired: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
