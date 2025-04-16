import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  mflApiUrl: process.env.MFL_API_URL,
  openhim: {
    username: process.env.OPENHIM_USERNAME,
    password: process.env.OPENHIM_PASSWORD,
    apiUrl: process.env.OPENHIM_API_URL,
  },
}));
