import App from '@/app';
import { IndexController } from '@controllers/index.controller';
import validateEnv from '@utils/validateEnv';
import { UserController } from './controllers/user.controller';
import { HealthController } from './controllers/health.controller';
import { ErrandController } from './controllers/errand.controller';
import { MetadataController } from './controllers/metadata.controller';

validateEnv();

const app = new App([IndexController, UserController, HealthController, ErrandController, MetadataController]);

app.listen();
