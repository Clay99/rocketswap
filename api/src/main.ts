import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestApplicationOptions } from '@nestjs/common';
const fs = require("fs")

let options: NestApplicationOptions = {}

if (process.env.CONTEXT === 'remote') {
  options.httpsOptions = {
    key: fs.readFileSync("./certs/key.pem"),
    cert: fs.readFileSync("./certs/pub.pem")
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, options);

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "rocketswap.exchange"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Origin", "*.rocketswap.exchange"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Origin", "rswp.io"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  
  app.enableCors({origin: '*'});
  await app.listen(2053);
}
bootstrap();
