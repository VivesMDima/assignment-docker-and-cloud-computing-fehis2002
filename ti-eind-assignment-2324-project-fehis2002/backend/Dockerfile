FROM node:20-alpine

WORKDIR /app

COPY package*.json .
RUN npm install
COPY . .
ENV NODE_ENV="Production"

EXPOSE 3000
CMD node server.js
