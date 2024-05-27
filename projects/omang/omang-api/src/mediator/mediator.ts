import * as fs from 'fs';
import * as winston from 'winston';
import {config} from '../config/config';
import {registerMediator, activateHeartbeat, fetchConfig} from 'openhim-mediator-utils';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'Mediator' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

const errorTypes = ['unhandledRejection', 'uncaughtException'];
const signalTraps: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];



const theConfig = JSON.parse(fs.readFileSync(`${__dirname}/../app-settings.json`, 'utf-8'));
const medConfig = theConfig.mediatorConfig.mediatorSetup;



export class Mediator {
 

  private config: any
  constructor() {

  }

  public async start(callback: any) {
    logger.info('Running Service as a mediator with ' + `${__dirname}/${config}`);

    try {
      // Mediator registration
      console.log(medConfig);
     registerMediator(theConfig.mediatorConfig.openHimAuth,
      medConfig, Mediator.registrationCallback(callback));
    } catch (e: any) {
      logger.error(`Could not start Service as a Mediator!\n${JSON.stringify(e)}`);
      process.exit(1);
    }

    
    errorTypes.map(type => {
      process.on(type, async e => {
        try {
          logger.error(`Caught error: process.on ${type}`);
          logger.error(e);
          logger.error(e.stack);
        } catch (_) {
          process.exit(1);
        }
      });
    });

    signalTraps.map(type => {
      process.once(type, async () => {
        try {
          logger.info('Received signal:', type);
          // Any cleanup code can be added here
        } finally {
          process.kill(process.pid, type);
        }
      });
    });
  };


  private static registrationCallback(callback: any) {
    return (err: Error | null) => {
      if (err) {
        logger.error(
          'Failed to register mediator at ' +
          theConfig.mediatorConfig.openHimAuth.apiUrl +
          '\nCheck your config!\n'
        );

        console.log(err);

        logger.error(err.stack || '');
        process.exit(1);
  
      } else {
        theConfig.mediatorConfig.openHimAuth.urn  = medConfig.urn;
        fetchConfig(theConfig.mediatorConfig.openHimAuth, Mediator.setupCallback(callback));
      }
    };
  }

  private static setupCallback(callback: any) {
    return (err: Error | null, initialConfig: any) => {
      if (err) {
        logger.error('Failed to fetch initial config');
        process.exit(1);
      }
      const updatedConfig: JSON = Object.assign(theConfig, initialConfig);
      logger.info('Received initial config:', initialConfig);
      Mediator.reloadConfig(updatedConfig, Mediator.startupCallback(callback));
    };
  }

  private static async startServer(appInstance, port, callback) {
    try {
        const configEmitter = activateHeartbeat(theConfig.config.mediatorConfig.openHimAuth);
        configEmitter.on('config', Mediator.updateCallback(callback));
        await appInstance.listen(port);
        callback(appInstance);
    } catch (error) {
        logger.error(error);
    }
}

  private static startupCallback(callback: any) {
    return async () => {
      try {
        theConfig.mediatorConfig.openHimAuth.urn  = medConfig.urn;
        logger.info('Successfully registered mediator!');
        const port = 5002;
        const app = await NestFactory.create(AppModule);
        // await Mediator.startServer(app, port,callback);
        await app.listen(port, () => {
          try {
            const configEmitter = activateHeartbeat(theConfig.mediatorConfig.openHimAuth);
            configEmitter.on('config', Mediator.updateCallback(callback));
            callback(app);

          } catch (error) {
            logger.error(error);
          }
        });
      } catch (error) {
        logger.error(error);
      }
    };
  }

  private static updateCallback(callback: any) {
    return (newConfig: JSON) => {
      logger.info('Received updated config:', newConfig);
      const updatedConfig = Object.assign(medConfig, newConfig);
      Mediator.reloadConfig(updatedConfig, () => {
        theConfig.mediatorConfig.openHimAuth.urn  = medConfig.urn;
      });
    };
  }

  private static reloadConfig(data: JSON, callback: any) {
    const tmpFile = `${__dirname}/../tmpConfig.json`;
    fs.writeFile(tmpFile, JSON.stringify(data), (err: Error | null) => {
      if (err) {
        throw err;
      }
      Object.assign(medConfig, data); // Directly update the configuration object
      callback();
    });
  }

 
}
