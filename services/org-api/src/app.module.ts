import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { RBACGuard } from './common/guards/rbac.guard';
import { SchoolNetworksModule } from './school-networks/school-networks.module';
import { SchoolsModule } from './schools/schools.module';
import { GradesModule } from './grades/grades.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { BillingModule } from './billing/billing.module';
import { ResourcesModule } from './resources/resources.module';

/**
 * App Module
 *
 * Guards are applied via APP_GUARD (JWT → Tenant → RBAC).
 * DI now works correctly thanks to SWC handling decorator metadata in tests.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule, // ✅ Authentication & JWT
    SchoolNetworksModule,
    SchoolsModule,
    GradesModule,
    ClassroomsModule,
    StudentsModule,
    TeachersModule,
    SubscriptionModule, // ✅ Subscription management
    BillingModule, // ✅ Billing & invoicing
    ResourcesModule, // ✅ Resource quota tracking
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RBACGuard,
    },
  ],
})
export class AppModule {}
