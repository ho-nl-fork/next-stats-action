FROM node:12-buster

COPY . /next-stats

# Install node_modules
RUN cd /next-stats && yarn install --production

RUN git config --global user.email 'stats@localhost'
RUN git config --global user.name 'next stats'

COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
