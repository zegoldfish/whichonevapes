# Builder stage: install all deps and build
FROM node:20-alpine AS builder
# Build-time AWS creds (used only during build for prerender/data fetches)
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_SESSION_TOKEN
ARG AWS_REGION
ARG AWS_EC2_METADATA_DISABLED=true

# Make them available to the build step; keep IMDS off during build
ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
ENV AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN
ENV AWS_REGION=$AWS_REGION
ENV AWS_EC2_METADATA_DISABLED=$AWS_EC2_METADATA_DISABLED
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage: only production deps and build output
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY public ./public

EXPOSE 3000

CMD ["npm", "start"]
