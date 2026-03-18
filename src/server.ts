import { buildServer } from "./app";

async function start() {
  const app = buildServer();

  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    // eslint-disable-next-line no-console
    console.log("Mini Redis server running at http://localhost:3000");
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
