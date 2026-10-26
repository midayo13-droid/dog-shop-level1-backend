import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { FriendlyErrorFilter } from './common/errors.filter.js';
import { initDatabase } from './common/schema.js';

async function bootstrap() {
  // 테이블이 없으면 만들고, 비어 있으면 가상 데이터를 채워 넣어요.
  await initDatabase();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 사진(최대 5MB)을 글자로 바꿔 보내므로 받는 크기를 넉넉히 늘려요.
  app.useBodyParser('json', { limit: '8mb' });
  app.useGlobalFilters(new FriendlyErrorFilter());

  const origins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins.length > 0 ? origins : true });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`서버가 켜졌어요: http://localhost:${port}  (확인: /health)`);
}
await bootstrap();
