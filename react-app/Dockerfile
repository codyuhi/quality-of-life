# Develop stage
FROM node:14-alpine as develop-stage
WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . .

# Build stage
FROM develop-stage as build-stage
RUN yarn build

# Production stage
FROM nginx:alpine as production-stage
COPY --from=build-stage /app/build /usr/share/nginx/html
EXPOSE 90
CMD ["nginx", "-g", "daemon off;"]