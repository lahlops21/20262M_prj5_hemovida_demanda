import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { RequestsModule } from './requests/requests.module';
@Module({
imports: [
ConfigModule.forRoot({
isGlobal: true,
cache: true,
validate: validateEnv,
}),
PrismaModule,
HealthModule,
RequestsModule,
],
})
export class AppModule {}