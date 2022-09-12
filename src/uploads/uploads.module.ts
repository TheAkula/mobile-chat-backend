import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadsService } from './uploads.service';

@Module({
  imports: [ConfigModule],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
