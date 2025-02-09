FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY . .

ENTRYPOINT ["node", "index.js"]
CMD []
