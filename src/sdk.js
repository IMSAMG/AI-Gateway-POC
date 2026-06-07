export class GatewayClient {
  constructor({ baseUrl = "http://127.0.0.1:3000" } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async chat(request) {
    return this.post("/v1/gateway/chat", request);
  }

  async addDocument(document) {
    return this.post("/v1/documents", document);
  }

  async analytics() {
    const response = await fetch(`${this.baseUrl}/v1/analytics`);
    return response.json();
  }

  async taskTypes() {
    const response = await fetch(`${this.baseUrl}/v1/task-types`);
    return response.json();
  }

  async post(path, body) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return response.json();
  }
}
