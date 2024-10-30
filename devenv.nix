{ pkgs,  ... }:

{
  packages = [ 
    pkgs.git
  ];

  languages.deno.enable = true;
  languages.deno.package = pkgs.deno;
  languages.javascript.enable = true;
}
