# syntax=docker/dockerfile:1

FROM oven/bun:latest AS build
WORKDIR /app

# Install dependencies and build
COPY package.json bun.lock tsconfig.json ./
COPY . .
RUN bun install
RUN bun run build

# Production image
FROM oven/bun:slim AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/bun.lock ./
COPY --from=build /app/.supervisorrc.json ./.supervisorrc.json

ENTRYPOINT ["bun", "run", "start:server"]
EXPOSE 3000
