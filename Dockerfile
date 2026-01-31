FROM node:20-bookworm-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN mkdir -p /ms-playwright
RUN npx playwright install chromium --with-deps

COPY . .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]