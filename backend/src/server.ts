import { IndexController } from '@controllers/index.controller';
import validateEnv from '@utils/validateEnv';

import App from '@/app';

import { ErrandController } from './controllers/errand.controller';
import { HealthController } from './controllers/health.controller';
import { MetadataController } from './controllers/metadata.controller';
import { UserController } from './controllers/user.controller';

validateEnv();

const app = new App([IndexController, UserController, HealthController, ErrandController, MetadataController]);

app.listen();
