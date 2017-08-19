FROM node:8-alpine

LABEL maintainer="Olivier Robardet <olivier.robardet@gmail.com>"

RUN apk --update add bash ruby imagemagick ca-certificates git && \
    apk --update add --virtual sass-dev build-base ruby-dev libffi-dev && \
	gem install -N sass && \
	apk del sass-dev && rm -rf /var/cache/apk/*

ENV PORT=3000
ENV NODE_ENV=production
ENV APP_USER=3dptools

ENV database__host=mongo
ENV redis__host=redis
ENV sentry__dsn="https://88009fc2f595471ea9808336a43e42cd@sentry.io/148531"

RUN adduser -D -g "" -G users $APP_USER

COPY src /3dptools
COPY CHANGELOG.md /3dptools/CHANGELOG.md
COPY docker/docker_start.sh /docker_start.sh
RUN chown -R $APP_USER:users /docker_start.sh /3dptools && chmod +x /docker_start.sh

WORKDIR /3dptools

RUN apk --update add --virtual 3dpt-dev build-base python krb5-dev sudo && \
    sudo -u $APP_USER npm install && \
    sudo -u $APP_USER npm remove node-gyp && \
    sudo -u $APP_USER npm cache clean --force && \
    sudo -u $APP_USER rm -fr /home/$APP_USER/.node-gyp /home/$APP_USER/.npm /home/$APP_USER/.cache && \
    apk del 3dpt-dev && rm -rf /var/cache/apk/*

USER $APP_USER
RUN npm run bower install && \
    npm run bower cache clean
RUN scss -C -f public/stylesheets/style.scss public/stylesheets/style.css

EXPOSE $PORT

CMD ["/docker_start.sh"]
