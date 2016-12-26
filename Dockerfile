FROM node:7-alpine
MAINTAINER Olivier Robardet <olivier.robardet@gmail.com>

RUN apk add --no-cache bash ruby imagemagick ca-certificates git && \
	gem install -N sass

ENV PORT=3000
ENV NODE_ENV=production

COPY src /3dptools
COPY docker/docker_start.sh /docker_start.sh
RUN chmod +x /docker_start.sh

WORKDIR /3dptools

RUN npm install && node_modules/.bin/bower --allow-root install
RUN scss -f public/stylesheets/style.scss public/stylesheets/style.css

EXPOSE $PORT

CMD ["/docker_start.sh"]

