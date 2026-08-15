FROM oven/bun:1.3.14-alpine AS base
WORKDIR /app

FROM base AS install
RUN mkdir -p /temp/dev /temp/prod
COPY package.json bun.lock* /temp/dev/
COPY package.json bun.lock* /temp/prod/
RUN cd /temp/dev && if [ -f bun.lockb ] || [ -f bun.lock ]; then \
      bun install --frozen-lockfile; \
    else \
      bun install; \
    fi
RUN cd /temp/prod && if [ -f bun.lockb ] || [ -f bun.lock ]; then \
      bun install --frozen-lockfile --production; \
    else \
      bun install --production; \
    fi

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules/ node_modules/
COPY . .

ENV NODE_ENV=production
RUN bun test

FROM base AS release
COPY --from=install /temp/prod/node_modules/ node_modules/
COPY --from=prerelease /app/src/ src/
COPY --from=prerelease /app/package.json ./
COPY --from=prerelease /app/bun.lock* ./

USER bun
EXPOSE 3000/tcp
ENV PORT=3000
ENV NODE_ENV=production

ENTRYPOINT [ "bun", "run", "src/index.ts" ]
