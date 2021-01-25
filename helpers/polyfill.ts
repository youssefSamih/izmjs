/**
 * Module dependencies.
 */
import dotenv from 'dotenv';

dotenv.config({
  path: './.env/.common.env',
});

const env = process.env.NODE_ENV || 'development';

dotenv.config({
  path: `./.env/.${env}.env`,
});

import 'module-alias/register';
