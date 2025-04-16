import { registerMediator, mediatorConfig } from "openhim-mediator-utils";

export const openhimConfig = {
  username: process.env.OPENHIM_USERNAME || "root@openhim.org",
  password: process.env.OPENHIM_PASSWORD || "openhim-password",
  apiURL: process.env.OPENHIM_API_URL || "https://localhost:8080",
  trustSelfSigned: true,
  urn: "urn:mediator:mfl-mediator",
  version: "1.0.0",
  name: "MFL Mediator",
  description: "Mediator for Botswana Master Facility List",
  defaultChannelConfig: [
    {
      name: "MFL Mediator",
      urlPattern: "^/mfl/.*$",
      routes: [
        {
          name: "MFL API",
          host: process.env.MFL_API_URL || "https://mfldit.gov.org.bw",
          port: 443,
          primary: true,
        },
      ],
      allow: ["mfl-mediator"],
    },
  ],
  endpoints: [
    {
      name: "MFL Locations",
      path: "/mfl/locations",
      method: "GET",
    },
    {
      name: "MFL Organizations",
      path: "/mfl/organizations",
      method: "GET",
    },
  ],
};

export async function registerOpenHimMediator() {
  try {
    await registerMediator(openhimConfig);
    console.log("Successfully registered mediator with OpenHIM");
  } catch (error) {
    console.error("Failed to register mediator:", error);
    throw error;
  }
}
