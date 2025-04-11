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
}
