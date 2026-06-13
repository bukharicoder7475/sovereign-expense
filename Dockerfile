FROM node:20-alpine

WORKDIR /app

# Copy backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy frontend build dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --omit=dev

# Copy backend source
COPY backend/ ./backend/

# Build frontend
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV SERVE_FRONTEND=true
ENV PORT=5000
ENV DATABASE_PATH=/app/data/splitwise.db

EXPOSE 5000

CMD ["node", "backend/server.js"]
