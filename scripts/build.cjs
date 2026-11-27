'use strict';

if (process.argv.includes('--catalog') || ['preview', 'production'].includes(process.env.VERCEL_ENV)) {
  require('./build-catalog.cjs').build();
} else {
  require('./build-holding.cjs');
}
