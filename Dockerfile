FROM node:8-alpine
MAINTAINER Olivier Robardet <olivier.robardet@gmail.com>

RUN apk --update add bash ruby imagemagick ca-certificates git && \
    apk --update add --virtual 3dpt-dev build-base ruby-dev libffi-dev python g++ gcc libgcc libstdc++ linux-headers make && \
	gem install -N sass && \
	apk del 3dpt-dev

ENV PORT=3000
ENV NODE_ENV=production
ENV sentry__dsn=https://88009fc2f595471ea9808336a43e42cd:38ebfe3e7c744d3fb19a8bab712a8a7a@sentry.io/148531

COPY src /3dptools
COPY CHANGELOG.md /3dptools/CHANGELOG.md
COPY docker/docker_start.sh /docker_start.sh
RUN chmod +x /docker_start.sh

WORKDIR /3dptools

RUN npm install && node_modules/.bin/bower --allow-root install
RUN scss -f public/stylesheets/style.scss public/stylesheets/style.css

EXPOSE $PORT

CMD ["/docker_start.sh"]

