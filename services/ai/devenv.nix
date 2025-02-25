{ pkgs, lib, config, ... }:
{
  languages.python = { enable = true; uv.enable = true; };
}
