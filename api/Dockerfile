FROM node:14 AS build
WORKDIR /srv
ADD . .
RUN npm install && npm run build

FROM node:14-slim
COPY --from=build /srv .
EXPOSE 80
CMD ["npm", "run", "start"]