import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  port: parseInt(<string>process.env.PORT ?? '3000'),
  nodenv: process.env.NODE_ENV,
}));
