# Develop stage
FROM node:18-alpine AS develop-stage
WORKDIR /app
COPY ./app /app
RUN yarn install

# Build stage
FROM develop-stage AS build-stage
RUN yarn build

# Production stage
FROM nginx:1.25.1-alpine AS production-stage
COPY --from=build-stage /app/build /usr/share/nginx/html
EXPOSE 90
CMD ["nginx", "-g", "daemon off;"]