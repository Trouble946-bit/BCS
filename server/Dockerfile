FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production --no-audit --no-fund || npm install --no-audit --no-fund

# Copy source
COPY . ./

EXPOSE 3000

CMD ["npm", "start"]
