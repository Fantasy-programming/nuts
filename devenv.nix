{ pkgs,  ... }:

{
  packages = [
    pkgs.git
    pkgs.nodePackages_latest.localtunnel
  ];

  languages.javascript = {
    enable = true;
    package = pkgs.nodejs-slim_23;
    pnpm.enable = true;
    npm.enable = true;
  };

  languages.java = {
    enable = true;
    gradle.enable = true;
  };

  processes = {
    web-client.exec = "cd client && pnpm run dev";
    go-server.exec = "cd server && air";
    ai-service.exec = "cd services/ai && uv run uvicorn app.main:app --port 8000";
  };
}
