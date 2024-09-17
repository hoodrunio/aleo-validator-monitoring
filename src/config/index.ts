export default {
    database: {
      url: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/aleo_monitor',
    },
    api: {
      port: process.env.PORT || 3000,
    },
    aleo: {
      sdkUrl: 'https://api.explorer.provable.com/v1',
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'your_jwt_secret',
      expiresIn: '1d',
    },
  };