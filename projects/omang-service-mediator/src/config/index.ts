import * as nconf from 'nconf';

nconf.argv().env().file(`${__dirname}/../../src/app-settings.json`);

export { nconf as config };

export default nconf;
