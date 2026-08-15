import "./config/firebase";

import { app } from "./app";

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`🚀 Event Challenge API running at http://localhost:${port}`);
  console.log(`📄 Swagger docs at http://localhost:${port}/docs`);
});
