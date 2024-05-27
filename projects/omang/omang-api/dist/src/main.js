"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const openhim_mediator_utils_1 = require("openhim-mediator-utils");
const mediatorConfig = require("../mediatorConfig.json");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const openhimConfig = {
        username: 'root@openhim.org',
        password: 'openhim',
        apiURL: 'https://openhim-core:8080',
        trustSelfSigned: true
    };
    (0, openhim_mediator_utils_1.registerMediator)(openhimConfig, mediatorConfig, err => {
        console.log(mediatorConfig);
        if (err) {
            throw new Error(`Failed to register mediator. Check your Config. ${err}`);
        }
    });
    await app.listen(5002);
}
bootstrap();
//# sourceMappingURL=main.js.map