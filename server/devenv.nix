{ pkgs, ... }:

{
  env.GOOSE_DRIVER="postgres";
  env.GOOSE_DBSTRING="postgresql://test:secret@localhost:5432/nuts?sslmode=disable";

  packages = [ 
    pkgs.air
    pkgs.sqlc
    pkgs.go-task
    pkgs.goose
    pkgs.httpie
  ];

  languages.go.enable = true;
  dotenv = {
    enable = true;
    filename = ".env.server";
  };

  services.postgres = {
    enable = true;
    initialScript = "CREATE USER test SUPERUSER;";
    listen_addresses = "127.0.0.1";
    package = pkgs.postgresql_16;
    initialDatabases = [
      { 
        name = "nuts";
      }
    ];
    settings = {
      log_connections = true;
      log_statement = "all";
    };
  };
}
