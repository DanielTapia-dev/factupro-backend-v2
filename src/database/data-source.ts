import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { getDataSourceOptions } from './typeorm.config';

config();

export default new DataSource(getDataSourceOptions());
