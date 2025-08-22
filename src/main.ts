import { NestFactory } from '@nestjs/core';
import { ChromaClient } from 'chromadb';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('INittt....');

  const client = new ChromaClient({
    ssl: false,
    host: 'localhost',
    port: 8000,
    database: 'wompi-docs',
    headers: {},
  });

  const r = await client.heartbeat();
  console.log(r);

  console.log();

  const collectionsSubset = await client.listCollections({
    limit: 20,
    offset: 50,
  });

  console.log(collectionsSubset);

  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
