FROM node:8-alpine
MAINTAINER Olivier Robardet <olivier.robardet@gmail.com>

RUN apk --update add bash ruby imagemagick ca-certificates git && \
    apk --update add --virtual 3dpt-dev build-base ruby-dev libffi-dev && \
	gem install -N sass && \
	apk del 3dpt-dev

ENV PORT=3000
ENV NODE_ENV=production

COPY src /3dptools
COPY CHANGELOG.md /3dptools/CHANGELOG.md
COPY docker/docker_start.sh /docker_start.sh
RUN chmod +x /docker_start.sh

WORKDIR /3dptools

RUN npm install && node_modules/.bin/bower --allow-root install
RUN scss -f public/stylesheets/style.scss public/stylesheets/style.css

EXPOSE $PORT

CMD ["/docker_start.sh"]

