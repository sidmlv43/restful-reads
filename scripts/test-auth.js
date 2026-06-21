#!/usr/bin/env node
require("dotenv").config();

const baseUrl =
  process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

async function request(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function main() {
  const unique = Date.now();
  const email = `smoke+${unique}@example.com`;
  const password = "SmokePass123!";

  const registerPayload = {
    name: "Smoke Test User",
    email,
    password,
  };

  const { response: registerResponse, data: registerData } = await request(
    "/api/auth/register",
    registerPayload,
  );

  console.log("Register status:", registerResponse.status);
  console.log("Register response:", registerData);

  if (!registerResponse.ok || !registerData.token) {
    throw new Error("Register request failed");
  }

  const loginPayload = {
    email: `  ${email.toUpperCase()}  `,
    password,
  };

  const { response: loginResponse, data: loginData } = await request(
    "/api/auth/login",
    loginPayload,
  );

  console.log("Login status:", loginResponse.status);
  console.log("Login response:", loginData);

  if (!loginResponse.ok || !loginData.token) {
    throw new Error("Login request failed");
  }

  console.log("Auth smoke test passed.");
}

main().catch((err) => {
  console.error("Auth smoke test failed:", err.message);
  process.exit(1);
});
