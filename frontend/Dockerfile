# =====================
# Build
# =====================
FROM registry.access.redhat.com/ubi9/nodejs-22 AS builder

USER root
RUN mkdir -p /app && chown -R 1001:0 /app
USER 1001
WORKDIR /app

COPY --chown=1001:0 package.json yarn.lock ./
RUN npm install -g yarn \
 && yarn install --frozen-lockfile

COPY --chown=1001:0 . .
# Build-time placeholder env (replaced at runtime by entrypoint.sh).
# Drakel's middleware-envs generator and Next read ./.env, so the placeholders go there.
COPY --chown=1001:0 .env-cicd .env

ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=true

# Optional deploy info from CI pipeline (Tekton)
ARG DEPLOY_COMMIT=""
ARG DEPLOY_BRANCH=""
RUN if [ -n "$DEPLOY_COMMIT" ]; then \
  printf '{\n  "commit": "%s",\n  "branch": "%s",\n  "updatedAt": "%s"\n}' \
    "$DEPLOY_COMMIT" "$DEPLOY_BRANCH" "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" \
  > public/deploy-info.json && echo "Generated deploy-info.json from build args"; \
fi

RUN yarn build

# =====================
# Runtime
# =====================
FROM registry.access.redhat.com/ubi9/nodejs-22 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the Next standalone output (root-owned, read-only)
COPY --from=builder --chown=0:0 --chmod=555 /app/next.config.js ./
COPY --from=builder --chown=0:0 --chmod=555 /app/public ./public
COPY --from=builder --chown=0:0 --chmod=444 /app/package.json ./
COPY --from=builder --chown=0:0 --chmod=555 /app/.next/standalone ./
COPY --from=builder --chown=0:0 --chmod=555 /app/.next/static ./.next/static

# entrypoint.sh rewrites placeholders in .next and server.js at startup, so make those writable.
USER root
COPY entrypoint.sh ./
RUN sed -i 's/\r$//' ./entrypoint.sh \
 && chmod 0555 ./entrypoint.sh \
 && chown 1001:0 /app /app/server.js \
 && chmod g+w /app/server.js \
 && chown -R 1001:0 /app/.next \
 && chmod -R g+w /app/.next
USER 1001

EXPOSE 3000
ENV PORT 3000

ENTRYPOINT ["/app/entrypoint.sh"]
