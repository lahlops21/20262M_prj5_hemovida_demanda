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
export class AppModule {
  constructor() {
  console.log('DATABASE_URL carregada:', !!process.env.DATABASE_URL);
  console.log('JWT_SECRET carregado:', !!process.env.JWT_SECRET);
}
}