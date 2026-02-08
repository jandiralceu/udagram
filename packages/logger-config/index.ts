const logger = {
  development: {
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        levelFirst: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
        singleLine: true,
      },
    },
  },
  production: true,
  test: false,
}

export default logger
