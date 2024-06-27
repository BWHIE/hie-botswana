import nconf from 'nconf';
import * as path from 'path'; 

const env = process.env.NODE_ENV || 'ci'

const configPath = path.join(__dirname, '../../src/config.json');// console.log('Config file path:', configPath);
nconf.argv()
     .env()
     .file({ file: configPath });


export { nconf as config }
export default nconf
