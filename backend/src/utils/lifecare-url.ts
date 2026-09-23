import { LIFECARE_BASE_URL } from '@config';
import { LifecareModule } from '@interfaces/lifecare.interface';

/**
 * Builds an absolute Lifecare URL.
 *
 * Lifecare is reached directly on its own host, like caremanagement and unlike the APIs behind the
 * shared gateway. Every path is scoped by the module that serves it, because that is also the unit
 * a session is bootstrapped for.
 *
 * @param module The Lifecare web module serving the path
 * @param parts Path segments below the module, e.g. `api2`, `Person/Search`
 */
export const lifecareUrl = (module: LifecareModule, ...parts: string[]): string => {
  const segments = [LIFECARE_BASE_URL, module, ...parts];
  return segments.map(segment => segment.replace(/^\/+|\/+$/g, '')).join('/');
};
