import * as nconf from 'nconf';
import * as path from 'path';

const env = process.env.NODE_ENV || 'ci';

nconf.argv().env().file(`${__dirname}/../app-settings.json`);

export { nconf as config };
export default nconf;
