import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AdminBootstrapService } from './admin-bootstrap.service';

@Module({
  imports: [UsersModule],
  providers: [AdminBootstrapService],
})
export class BootstrapModule {}
