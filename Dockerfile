FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt update && apt install -y curl bash sudo nodejs npm nano htop neofetch openssh-server iproute2 net-tools && \
    npm install -g node-pty 2>/dev/null || true && \
    useradd -m -s /bin/bash vps && echo "vps:vps" | chpasswd && adduser vps sudo && \
    echo "vps ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers && \
    mkdir -p /var/run/sshd && ssh-keygen -A && echo 'root:root+123+' | chpasswd && sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config && sed -i 's/#PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
WORKDIR /app
COPY package.json server.js ./
COPY public ./public
RUN npm install
EXPOSE 3000 22
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
CMD ["/entrypoint.sh"]
