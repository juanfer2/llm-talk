import { NestFactory } from '@nestjs/core';
import { ChromaClient } from 'chromadb';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('INittt....');

  const client = new ChromaClient({
    ssl: false,
    host: 'localhost',
    port: 8001,
    database: 'wompi-docs',
    headers: {},
  });

  await client.heartbeat();

  const collectionsSubset = await client.listCollections({
    limit: 20,
    offset: 50,
  });

  console.log(collectionsSubset);

  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
