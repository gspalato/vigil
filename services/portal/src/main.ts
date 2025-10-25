import 'dotenv/config';

import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import ngrok from '@ngrok/ngrok';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({
    type: VersioningType.URI,
  });

  const options = new DocumentBuilder()
    .setTitle('Vigil Portal')
    .setDescription("The gateway to Vigil's backend.")
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  const outputPath = path.resolve(process.cwd(), 'openapi.json');
  writeFileSync(outputPath, JSON.stringify(document), { encoding: 'utf8' });

  const port = Number(process.env.PORT ?? 3000);

  console.log(`\n🚀 Listening at :${port}`);
  await app.listen(port);

  if (process.env.environment === 'dev') {
    console.log('Trying to connect to ngrok tunnel...');
    try {
      let listener = await ngrok.forward({
        addr: port,
        authtoken: process.env.NGROK_AUTHTOKEN,
        domain: process.env.NGROK_DOMAIN,
      });

      console.log(`\n🚀 ngrok tunnel running at: ${listener.url()}`);
    } catch (e) {
      console.log('Failed to connect to ngrok tunnel:', e.message);
    }
  }
}

bootstrap();
