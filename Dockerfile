FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt update && apt install -y curl bash sudo nodejs npm nano htop neofetch && \
    npm install -g node-pty 2>/dev/null || true && \
    useradd -m -s /bin/bash vps && echo "vps:vps" | chpasswd && adduser vps sudo && \
    echo "vps ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
WORKDIR /app
COPY package.json server.js ./
COPY public ./public
RUN npm install
EXPOSE 3000
CMD ["node","server.js"]
