import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import 'proj4';
import { register } from 'ol/proj/proj4';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
