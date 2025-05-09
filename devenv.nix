{ pkgs,  ... }:

{
  packages = [
    pkgs.git
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
    webClient.exec = "cd client && pnpm run dev";
    goServer.exec = "cd server && air";
  };
}
