
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/content

EXPOSE 3000

CMD ["sh", "-c", "npm run db:migrate && npm run db:import && npm run dev"]
