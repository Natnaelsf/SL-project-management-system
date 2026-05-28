import { Module } from '@nestjs/common';
import { IpcController } from './ipc.controller';
import { IpcService } from './ipc.service';

@Module({
  controllers: [IpcController],
  providers: [IpcService],
  exports: [IpcService],
})
export class IpcModule {}
