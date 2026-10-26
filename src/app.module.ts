import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { EventsController, NoticesController } from './boards/boards.controller.js';
import { DogsController } from './dogs/dogs.controller.js';
import { GroomersController } from './groomers/groomers.controller.js';
import { GuardiansController } from './guardians/guardians.controller.js';
import { RecordsController } from './records/records.controller.js';

@Module({
  controllers: [
    AppController,
    GuardiansController,
    DogsController,
    GroomersController,
    RecordsController,
    NoticesController,
    EventsController,
  ],
})
export class AppModule {}
