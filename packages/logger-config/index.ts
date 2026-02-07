const logger = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'hostname',
        translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
      },
    },
  },
  production: true,
  test: false,
}

export default logger
