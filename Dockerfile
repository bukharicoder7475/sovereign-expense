FROM node:20-alpine

WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

COPY backend/ ./backend/

ENV NODE_ENV=production
ENV SERVE_FRONTEND=true
ENV PORT=5000

EXPOSE 5000

CMD ["node", "backend/server.js"]
