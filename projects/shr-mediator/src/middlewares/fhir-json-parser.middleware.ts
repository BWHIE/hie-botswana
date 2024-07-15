import { Injectable, NestMiddleware } from '@nestjs/common';
import * as bodyParser from 'body-parser';

@Injectable()
export class FhirJsonParserMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    // Check if the content type is 'application/fhir+json'
    if (req.is('application/fhir+json')) {
      // Use body-parser to parse the body
      const callback = bodyParser.json({
        strict: false,
        type: 'application/fhir+json',
      });

      callback(req, res, next);
    } else {
      next();
    }
  }
}
