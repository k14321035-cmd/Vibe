FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --production=false

COPY backend/src ./src
COPY backend/tsconfig.json ./

EXPOSE 3001

CMD ["npm", "run", "dev"]
