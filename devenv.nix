{ pkgs,  ... }:

{
  packages = [
    pkgs.git
    pkgs.nodePackages_latest.localtunnel
    pkgs.eas-cli
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
    web-marketing.exec = "cd marketing && pnpm run dev";
    go-server.exec = "cd server && air";
    ai-service.exec = "cd services/ai && uv run uvicorn app.main:app --port 8000";
    otel.exec = "docker run -d --name jaeger -e COLLECTOR_OTLP_ENABLED=true -p 16686:16686 -p 4317:4317 -p 4318:4318 jaegertracing/all-in-one:latest";
  };

  tasks = {
    "otel:cleanup" = {
      exec = ''
        echo "Cleaning up Jaeger container..."
        # Stop and remove the Jaeger container
        docker stop jaeger 2>/dev/null || true
        docker rm jaeger 2>/dev/null || true
        # Clean up any dangling volumes (optional)
        docker volume prune -f 2>/dev/null || true
        echo "Jaeger cleanup completed"
      '';
      after = [ "devenv:processes:otel" ];
    };
  };
}
