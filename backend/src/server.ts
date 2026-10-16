import app from "./app.js";
import { config, validateEnvironment } from "./config.js";
import { prisma } from "./db.js";

validateEnvironment();
const server = app.listen(config.port, "0.0.0.0", () => console.log(`Cyber Awareness Lab listening on 0.0.0.0:${config.port}`));
async function shutdown() { server.close(async () => { await prisma.$disconnect(); process.exit(0); }); }
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
