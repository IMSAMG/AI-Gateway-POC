import http from "node:http";
import { AiGateway } from "./gateway.js";
import { getConfig } from "./config.js";
import { TASK_TEMPLATES } from "./taskTemplates.js";

const config = getConfig();
const gateway = new AiGateway({ config });

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      return sendJson(res, 200, { ok: true, service: "ai-gateway-poc" });
    }

    if (req.method === "GET" && req.url === "/v1/config") {
      return sendJson(res, 200, {
        optimization: config.optimization,
        models: config.models
      });
    }

    if (req.method === "GET" && req.url === "/v1/task-types") {
      return sendJson(res, 200, { taskTypes: TASK_TEMPLATES });
    }

    if (req.method === "GET" && req.url === "/v1/documents") {
      return sendJson(res, 200, { documents: gateway.listDocuments() });
    }

    if (req.method === "POST" && req.url === "/v1/documents") {
      const body = await readJson(req);
      return sendJson(res, 201, { document: gateway.addDocument(body) });
    }

    if (req.method === "GET" && req.url === "/v1/analytics") {
      return sendJson(res, 200, gateway.analyticsSummary());
    }

    if (req.method === "POST" && req.url === "/v1/gateway/chat") {
      const body = await readJson(req);
      const result = await gateway.chat(body);
      return sendJson(res, 200, result);
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
});

if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(config.server.port, config.server.host, () => {
    console.log(`AI Gateway listening on http://${config.server.host}:${config.server.port}`);
  });
}

export { server, gateway };

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(payload, null, 2));
}
