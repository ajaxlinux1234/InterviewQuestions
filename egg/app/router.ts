import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;

  // 基本路由
  router.get('/', controller.home.index);
  router.get('/health', controller.home.health);
  router.get('/test-db', controller.home.testDb);
};