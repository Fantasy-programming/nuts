{ pkgs, ... }:

{
  env.GOOSE_DRIVER="postgres";
  env.GOOSE_DBSTRING="postgresql://test:secret@localhost:5432/nuts?sslmode=disable";
  env.PATH = "#{config.env.DEVENV_ROOT}/bin:$PATH";
  env.MINIO_KMS_SECRET_KEY="key:v6SLmyrcQDB/+/RcYEbHPWdI102S/hMFthros3GaO5I=";

  packages = [
    pkgs.air
    pkgs.sqlc
    pkgs.go-task
    pkgs.goose
    pkgs.httpie
    pkgs.k6
    pkgs.awscli2
  ];

  languages.go.enable = true;

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

  services.minio = {
    enable = true;
  };

  services.redis = {
    enable = true;
  };
}
