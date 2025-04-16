import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { MflModule } from "./modules/mfl/mfl.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TransactionService } from "./services/transaction.service";
import { registerOpenHimMediator } from "./config/openhim.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    MflModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TransactionService,
    {
      provide: "OPENHIM_REGISTRATION",
      useFactory: async () => {
        await registerOpenHimMediator();
      },
    },
  ],
})
export class AppModule {}
