'use strict';

if (process.argv.includes('--catalog') || ['preview', 'production'].includes(process.env.VERCEL_ENV)) {
  require('./build-catalog.cjs');
} else {
  require('./build-holding.cjs');
}
