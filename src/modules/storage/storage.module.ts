import { Module } from '@nestjs/common';
import { ImageStorageInterface } from './storage.interface';
import { LocalStorageService } from './storage.service';

@Module({
  providers: [
    {
      provide: ImageStorageInterface,
      useClass: LocalStorageService,
    },
  ],
  exports: [ImageStorageInterface],
})
export class StorageModule {}
