{ pkgs,  ... }:

{
  packages = [
    pkgs.git
  ];

  languages.javascript = {
    enable = true;
    package = pkgs.nodejs-slim_22;
    pnpm.enable = true;
    npm.enable = true;
  };
}
