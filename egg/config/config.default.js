const fs = require('fs');
const path = require('path');

exports.keys = 'egg-simple-keys';

// 基本配置 - 保持 HTTP/1.1 兼容
exports.cluster = {
  listen: {
    port: 7001,
    hostname: '127.0.0.1',
  }
};

exports.mysql = {
  client: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'im_service',
    connectionLimit: 5,
    acquireTimeout: 30000,
    timeout: 30000,
  }
};

exports.redis = {
  client: {
    port: parseInt(process.env.REDIS_PORT || '6379'),
    host: process.env.REDIS_HOST || 'localhost',
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0'),
    family: 4
  }
};

exports.security = {
  csrf: {
    enable: false
  }
};

exports.cors = {
  origin: '*',
  allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH'
};