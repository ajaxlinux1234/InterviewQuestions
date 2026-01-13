module.exports = app => {
  const { controller, router } = app;
  
  router.get('/', controller.home.index);
  router.get('/user', controller.user.index);
  router.get('/push', controller.user.push); // HTTP/2 服务器推送演示
};