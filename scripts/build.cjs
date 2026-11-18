'use strict';

if (process.argv.includes('--catalog') || process.env.VERCEL_ENV === 'preview') {
  require('./build-catalog.cjs');
} else {
  require('./build-holding.cjs');
}
