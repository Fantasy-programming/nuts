{ pkgs, lib, config, ... }:
{
  languages.python = { enable = true; directory="./services/ai"; uv = { enable = true; sync.enable = true; };  };
}
