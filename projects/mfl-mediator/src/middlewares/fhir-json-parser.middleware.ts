import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class FhirJsonParserMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.headers["content-type"] === "application/fhir+json") {
      req.headers["content-type"] = "application/json";
    }
    next();
  }
}
