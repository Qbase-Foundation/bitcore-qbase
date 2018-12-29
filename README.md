NOT YET FUNCTIONAL
=======

This is Traysi's fork of Bitpay's Bitcore/Under's Ravencore for Ritocoin. It has a limited segwit support.

----
Getting Started
=====================================
Deploying Ritocore full-stack manually:
----
````
sudo apt-get update
sudo apt-get -y install curl git python3 make build-essential libzmq3-dev python2.7
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash

#restart your shell/os

nvm install 10.5.0
nvm use 10.5.0

#install mongodb
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl enable mongod.service

#install ritocore
sudo ln -s /usr/bin/python2.7 /usr/bin/python
git clone https://github.com/traysi/ritocore.git
cd ritocore && git checkout master
npm install -g --production
````
Copy the following into a file named ritocore-node.json and place it in ~/.ritocore/ (be sure to customize username values(without angle brackets<>) and/or ports)
````json
{
  "network": "livenet",
  "port": 3001,
  "services": [
    "ritod",
    "web",
    "insight-api",
    "insight-ui"
  ],
  "allowedOriginRegexp": "^https://<yourdomain>\\.<yourTLD>$",
  "messageLog": "",
  "servicesConfig": {
    "web": {
      "disablePolling": true,
      "enableSocketRPC": false
    },
    "insight-ui": {
      "routePrefix": "",
      "apiPrefix": "api"
    },
    "insight-api": {
      "routePrefix": "api",
      "coinTicker" : "https://api.coinmarketcap.com/v1/ticker/ritocoin/?convert=USD",
      "coinShort": "RITO",
	    "db": {
		  "host": "127.0.0.1",
		  "port": "27017",
		  "database": "rito-api-livenet",
		  "user": "",
		  "password": ""
	  }
    },
    "ritod": {
      "sendTxLog": "/home/<yourusername>/.ritocore/pushtx.log",
      "spawn": {
        "datadir": "/home/<yourusername>/.ritocore/data",
        "exec": "/home/<yourusername>/ritocore/node_modules/ritocore-node/bin/ritod",
        "rpcqueue": 1000,
        "rpcport": 8501,
        "zmqpubrawtx": "tcp://127.0.0.1:28332",
        "zmqpubhashblock": "tcp://127.0.0.1:28332"
      }
    }
  }
}
````
Quick note on allowing socket.io from other services. 
- If you would like to have a seperate services be able to query your api with live updates, remove the "allowedOriginRegexp": setting and change "disablePolling": to false. 
- "enableSocketRPC" should remain false unless you can control who is connecting to your socket.io service. 
- The allowed OriginRegexp does not follow standard regex rules. If you have a subdomain, the format would be(without angle brackets<>):
````
"allowedOriginRegexp": "^https://<yoursubdomain>\\.<yourdomain>\\.<yourTLD>$",
````

To setup unique mongo credentials:
````
mongo
>use rito-api-livenet
>db.createUser( { user: "test", pwd: "test1234", roles: [ "readWrite" ] } )
>exit
````
(then add these unique credentials to your ritocore-node.json)

Copy the following into a file named rito.conf and place it in ~/.ritocore/data
````json
server=1
whitelist=127.0.0.1
txindex=1
addressindex=1
timestampindex=1
spentindex=1
zmqpubrawtx=tcp://127.0.0.1:28332
zmqpubhashblock=tcp://127.0.0.1:28332
rpcport=8501
rpcallowip=127.0.0.1
rpcuser=ritocoin
rpcpassword=local321 #change to something unique
uacomment=ritocore-sl

mempoolexpiry=72 # Default 336
rpcworkqueue=1100
maxmempool=2000
dbcache=1000
maxtxfee=1.0
dbmaxfilesize=64
````
Launch your copy of ritocore:
````
ritocored
````
You can then view the Ritocoin block explorer at the location: `http://localhost:3001`

Create an Nginx proxy to forward port 80 and 443(with a snakeoil ssl cert)traffic:
----
IMPORTANT: this "nginx-ritocore" config is not meant for production use
see this guide [here](https://www.nginx.com/blog/using-free-ssltls-certificates-from-lets-encrypt-with-nginx/) for production usage
````
sudo apt-get install -y nginx ssl-cert
````
copy the following into a file named "nginx-ritocore" and place it in /etc/nginx/sites-available/
````
server {
    listen 80;
    listen 443 ssl;
        
    include snippets/snakeoil.conf;
    root /home/ritocore/www;
    access_log /var/log/nginx/ritocore-access.log;
    error_log /var/log/nginx/ritocore-error.log;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 10;
        proxy_send_timeout 10;
        proxy_read_timeout 100; # 100s is timeout of Cloudflare
        send_timeout 10;
    }
    location /robots.txt {
       add_header Content-Type text/plain;
       return 200 "User-agent: *\nallow: /\n";
    }
    location /ritocore-hostname.txt {
        alias /var/www/html/ritocore-hostname.txt;
    }
}
````
Then enable your site:
````
sudo ln -s /etc/nginx/sites-available/nginx-ritocore /etc/nginx/sites-enabled
sudo rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default
sudo mkdir /etc/systemd/system/nginx.service.d
sudo printf "[Service]\nExecStartPost=/bin/sleep 0.1\n" | sudo tee /etc/systemd/system/nginx.service.d/override.conf
sudo systemctl daemon-reload
sudo systemctl restart nginx
````
Upgrading Ritocore full-stack manually:
----

- This will leave the local blockchain copy intact:
Shutdown the ritocored application first, and backup your unique rito.conf and ritocore-node.json
````
cd ~/
rm -rf .npm .node-gyp ritocore
rm .ritocore/data/rito.conf .ritocore/ritocore-node.json

#reboot

git clone https://github.com/traysi/ritocore.git
cd ritocore && git checkout lightweight
npm install -g --production
````
(recreate your unique rito.conf and ritocore-node.json)

- This will redownload a new blockchain copy:
(Some updates may require you to reindex the blockchain data. If this is the case, redownloading the blockchain only takes 20 minutes)
Shutdown the ritocored application first, and backup your unique rito.conf and ritocore-node.json
````
cd ~/
rm -rf .npm .node-gyp ritocore
rm -rf .ritocore

#reboot

git clone https://github.com/traysi/ritocore.git
cd ritocore && git checkout lightweight
npm install -g --production
````
(recreate your unique rito.conf and ritocore-node.json)

Undeploying Ritocore full-stack manually:
----
````
nvm deactivate
nvm uninstall 10.5.0
rm -rf .npm .node-gyp ritocore
rm .ritocore/data/rito.conf .ritocore/ritocore-node.json
mongo
>use rito-api-livenet
>db.dropDatabase()
>exit
````

## Applications

- [Node](https://github.com/traysi/ritocore-node) - A full node with extended capabilities using Ritocoin Core
- [Insight API](https://github.com/traysi/insight-api) - A blockchain explorer HTTP API
- [Insight UI](https://github.com/traysi/insight) - A blockchain explorer web user interface
- (to-do) [Wallet Service](https://github.com/traysi/ritocore-wallet-service) - A multisig HD service for wallets
- (to-do) [Wallet Client](https://github.com/traysi/ritocore-wallet-client) - A client for the wallet service
- (to-do) [CLI Wallet](https://github.com/traysi/ritocore-wallet) - A command-line based wallet client
- (to-do) [Angular Wallet Client](https://github.com/traysi/angular-ritocore-wallet-client) - An Angular based wallet client
- (to-do) [Copay](https://github.com/traysi/copay) - An easy-to-use, multiplatform, multisignature, secure ritocoin wallet

## Libraries

- [Lib](https://github.com/traysi/ritocore-lib) - All of the core Ritocoin primatives including transactions, private key management and others
- (to-do) [Payment Protocol](https://github.com/traysi/ritocore-payment-protocol) - A protocol for communication between a merchant and customer
- [P2P](https://github.com/traysi/ritocore-p2p) - The peer-to-peer networking protocol
- (to-do) [Mnemonic](https://github.com/traysi/ritocore-mnemonic) - Implements mnemonic code for generating deterministic keys
- (to-do) [Channel](https://github.com/traysi/ritocore-channel) - Micropayment channels for rapidly adjusting ritocoin transactions
- [Message](https://github.com/traysi/ritocore-message) - Ritocoin message verification and signing
- (to-do) [ECIES](https://github.com/traysi/ritocore-ecies) - Uses ECIES symmetric key negotiation from public keys to encrypt arbitrarily long data streams.

## Security

We're using Ritocore in production, but please use common sense when doing anything related to finances! We take no responsibility for your implementation decisions.

## Contributing

Please send pull requests for bug fixes, code optimization, and ideas for improvement. For more information on how to contribute, please refer to our [CONTRIBUTING](https://github.com/traysi/ritocore/blob/master/CONTRIBUTING.md) file.

## License

Code released under [the MIT license](https://github.com/traysi/ritocore/blob/master/LICENSE).
