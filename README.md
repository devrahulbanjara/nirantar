# Nirantar

<p align="center">
  <img src="frontend/public/logo/logo.png" alt="Nirantar" width="320">
</p>

**Nirantar** is a personal fitness and lifestyle tracking platform built around consistency. It helps track workouts, meals, body metrics, and long-term progress while exposing the data through MCP so AI tools like ChatGPT and Claude can provide personalized, data-driven insights and coaching.

## Connect Claude Desktop

1. Sign up for or sign in to your Nirantar account.
2. In Claude Desktop, open **Settings → Connectors → Add connector**.
3. Enter the following details:

   - **Name:** `Nirantar`
   - **Remote MCP server URL:** `https://api.nirantar.rahuldevbanjara.com.np/mcp/`
   - **OAuth Client ID:** Leave empty.
   - **OAuth Client Secret:** Leave empty.

4. Save the connector, then click **Connect**.
5. Claude will open Nirantar's Clerk OAuth panel. Sign in with your Nirantar account and approve the connection.
6. Enable the Nirantar connector in a Claude conversation to use your workout, meal, body-weight, and summary tools.

Each person must connect with their own Nirantar account. Nirantar scopes MCP data to the authenticated user.