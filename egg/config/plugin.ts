import tracerPlugin from '@eggjs/tracer';

export default {
  // enable tracer plugin
  ...tracerPlugin(),

  // 启用静态资源插件
  static: {
    enable: true,
  },

  // MySQL插件
  mysql: {
    enable: true,
    package: 'egg-mysql',
  },

  // Redis插件
  redis: {
    enable: true,
    package: 'egg-redis',
  },

  // CORS插件
  cors: {
    enable: true,
    package: 'egg-cors',
  }
};
