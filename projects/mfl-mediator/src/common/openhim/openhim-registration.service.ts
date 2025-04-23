import { Injectable, Logger } from "@nestjs/common";
import { registerMediator } from "openhim-mediator-utils";
import config from "../../config";

@Injectable()
export class OpenhimRegistrationService {
  private readonly logger = new Logger(OpenhimRegistrationService.name);

  async registerMediator() {
    try {
      await registerMediator(config.get("mediator"));
      this.logger.log("Successfully registered mediator with OpenHIM");
    } catch (error) {
      this.logger.error("Failed to register mediator:", error);
      throw error;
    }
  }
}
