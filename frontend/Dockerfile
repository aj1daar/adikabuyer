FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_CATALOG_API_URL=/api/catalog
ARG VITE_AUTH_API_URL=/api/auth
ARG VITE_MEDIA_API_URL=/api/media
ARG VITE_ORDER_API_URL=/api/orders
ENV VITE_CATALOG_API_URL=$VITE_CATALOG_API_URL \
    VITE_AUTH_API_URL=$VITE_AUTH_API_URL \
    VITE_MEDIA_API_URL=$VITE_MEDIA_API_URL \
    VITE_ORDER_API_URL=$VITE_ORDER_API_URL
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv/www
