require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const serverless = require('serverless-http');
const { AppModule } = require('../../dist/app.module.js');
const { configureApp } = require('../../dist/configure-app.js');

let handlerPromise;

async function createHandler() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  configureApp(app);
  try {
    await app.init();
    return serverless(app.getHttpAdapter().getInstance());
  } catch (error) {
    await app.close();
    throw error;
  }
}

exports.handler = async (event, context) => {
  handlerPromise ??= createHandler().catch((error) => {
    handlerPromise = undefined;
    throw error;
  });
  const handler = await handlerPromise;
  // Accept the original URL or Netlify's rewritten function path.
  const path = event.path.replace(/^\/\.netlify\/functions\/api(?=\/|$)/, '');
  return handler({ ...event, path }, context);
};
