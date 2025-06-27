import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
export default registerAs(
  'database',
  () =>
    ({
      schema: 'public',
      migrationsSchema: 'public',
      type: 'postgres',
      host: process.env.DATABSE_HOST,
      port: parseInt(process.env.DATABSE_PORT ?? '5432'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABSE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      ssl: { rejectUnauthorized: false },
      synchronize: true,
      logging: process.env.NODE_ENV === 'development',
      autoLoadEntities: process.env.NODE_ENV === 'development',
      migrations: [__dirname + '/../db/migrations/*{.ts,.js}'],
      migrationsTableName: 'migrations',
    }) as TypeOrmModuleOptions,
);
