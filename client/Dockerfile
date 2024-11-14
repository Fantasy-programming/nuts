FROM node:18-alpine AS builder

WORKDIR /app


COPY package.json pnpm-lock.yaml ./
RUN npm i

ARG NODE_ENV
ARG VITE_API_URL

ENV NODE_ENV=${NODE_ENV}
ENV VITE_API_URL=${VITE_API_URL}

COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80/tcp

CMD ["nginx", "-g", "daemon off;"]
