// The same Promise API, everywhere.

import * as Bluebird from 'bluebird'

const g: any =
  typeof global !== 'undefined' && global ||
  typeof window !== 'undefined' && window

g.Promise = Bluebird
