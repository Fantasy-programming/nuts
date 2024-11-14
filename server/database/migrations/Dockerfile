FROM gomicro/goose

WORKDIR /migrations

# Copy migrations and scripts
COPY *.sql ./
COPY entrypoint.sh ./

RUN chmod +x entrypoint.sh

ENTRYPOINT ["/migrations/entrypoint.sh"]
