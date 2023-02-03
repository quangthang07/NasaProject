FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./

COPY clients/package*.json clients/
RUN npm run install-client --only=production

COPY servers/package*.json servers/
RUN npm run install-server --only=production

COPY clients/ clients/
RUN npm run build --prefix clients

COPY servers/ servers/

USER node

CMD ["npm", "start", "--prefix", "servers"]

EXPOSE 8000
