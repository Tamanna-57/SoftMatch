# SoftMatch backend — container image for Google Cloud Run
FROM node:20-slim

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# App source
COPY . .

# Cloud Run provides PORT; the server reads process.env.PORT
ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server.js"]
