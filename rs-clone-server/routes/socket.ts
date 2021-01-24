/* eslint-disable class-methods-use-this */
import { Server } from 'ws';
import * as jwt from 'jsonwebtoken';
import appConfig from '../app-config';
import * as pg from '../storage/postgre';

interface PayloadInterface extends Object {
  id: string;
  login: String;
  password: String;
}

class WSServer {
  public wssInit(server: any) {
    const wss: Server = new Server({
      server,
      perMessageDeflate: false,
    });

    wss.on('connection', (ws, req) => {
      const websocket = ws;
      // this.onConnect(wss, websocket);

      websocket.on('close', () => {
        this.sendToEveryone(wss.clients, `{"gameDisconnectedMessage": "${websocket.token}", "chatServerMessage": "the user ${websocket.userName} has disconnected"}`);
      });

      websocket.on('message', (websocketData) => {
        if (websocketData[0] !== '{') {
          this.onMessageWithCode(wss, websocket, websocketData);
          return;
        }
        this.sendToEveryone(wss.clients, websocketData);
      });
    });
  }

  private onRegisterCommon(wss, ws, userName) {
    const websocket = ws;
    // websocket.wsToken = req.headers['sec-websocket-key'];
    websocket.token = this.getUserID(wss.clients);
    websocket.userName = userName;

    this.sendOnlyToYou(websocket, `{"setUserAsRegistered": "true", "setUserMount": "${wss.clients.size}", "setWsToken": "${websocket.token}", "setUserName": "${userName}", "chatServerMessage": "You are connected"}`);
    this.sendToAllButNotYou(websocket, wss.clients, `{"setUserMount": "${wss.clients.size}", "chatServerMessage": "User has connected"}`);
    this.sendToEveryone(wss.clients, `{"setNewWsToken": "${this.getWSTokensString(wss.clients)}"}`);
  }

  private onMessageWithCode(wss, currSocketConnection, websocketData) {
    const websocket = currSocketConnection;
    const newWebsocketData = websocketData.substr(1);
    switch (websocketData[0]) {
      case '0':
        try {
          const mess = JSON.parse(newWebsocketData);
          switch (mess.ask) {
            case 'register':
              this.login(wss, mess, websocket);
              break;

            case 'loginThroughPass':
              this.loginThroughPass(wss, mess, websocket);
              break;

            case 'setStat':
              break;

            default: break;
          }
        } catch {
          console.log(newWebsocketData);
        }
        break;
      case '1':
        this.sendToAllButNotYou(websocket, wss.clients, newWebsocketData);
        break;
      default: break;
    }
  }

  private login(wss, mess, ws) {
    const websocket = ws;
    jwt.verify(
      mess.userToken,
      appConfig.TOKEN_KEY,
      async (err, payload: PayloadInterface) => {
        if (err) {
          websocket.send(`{"failLogin": "TOKEN: ${err}"}`);
        }
        if (payload) {
          const item = await pg.getById(payload.id);
          if (item) {
            if (!this.isUserAlreadyRegistered(wss.clients, payload.id)) {
              this.onRegisterCommon(wss, ws, payload.login);
              websocket.isRegistered = true;
              websocket.id = payload.id;
              // websocket.userName = payload.login;
              const token = jwt.sign({ id: payload.id, login: payload.login }, appConfig.TOKEN_KEY, { expiresIn: '30d' });
              websocket.send(`{"chatServerMessage": "you are registered as ${payload.login}!", "setToken": "${token}"}`);
              console.log('user was registered through token');
            } else {
              websocket.send('{"failLogin": "through token: The User is Already Registered"}');
            }
          } else {
            websocket.send('{"failLogin": "through token: login doesn\'t exist"}');
          }
        }
      },
    );
  }

  private async loginThroughPass(wss, mess, ws) {
    const websocket = ws;
    if (mess.login && mess.password) {
      const item = await pg.getLogin(mess.login);
      if (item) {
        if (item.login === mess.login && item.password === mess.password) {
          const { id } = item;
          const { login } = item;
          console.log(`id ${id}`);
          if (!this.isUserAlreadyRegistered(wss.clients, id)) {
            this.onRegisterCommon(wss, ws, mess.login);
            websocket.isRegistered = true;
            websocket.id = id;
            // websocket.userName = mess.login;
            const token = jwt.sign({ id, login }, appConfig.TOKEN_KEY, { expiresIn: '30d' });
            websocket.send(`{"chatServerMessage": "you are registered as ${mess.login}!", "setToken": "${token}"}`);
            console.log('user was registered through password');
          } else {
            websocket.send('{"failLogin": "through password: The User is Already Registered"}');
          }
        } else {
          websocket.send('{"failLogin": "through password: the login or the password doesn\'t exist"}');
        }
      } else {
        websocket.send('{"failLogin": "through password: wrong login or password"}');
      }
    }
  }

  private getUserID(clients) {
    let UID = this.getUUID();
    while (this.isUserIDExist(clients, UID)) {
      UID = this.getUUID();
    }
    return UID;
  }

  private getUUID() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  private isUserIDExist(clients, id) {
    let isExist = false;
    clients.forEach((client) => {
      if (client.token === id) {
        isExist = true;
      }
    });
    return isExist;
  }

  private isUserAlreadyRegistered(clients, id) {
    let isExist = false;
    clients.forEach((client) => {
      if (client.id === id) {
        isExist = true;
      }
    });
    return isExist;
  }

  private getWSTokensString(clients) {
    const tokens = [];
    clients.forEach((client) => {
      tokens.push(client.token);
    });
    return tokens.join('___');
  }

  private sendOnlyToYou(websocket, string) {
    websocket.send(string);
  }

  private sendToEveryone(clients, string) {
    clients.forEach((client) => {
      client.send(string);
    });
  }

  private sendToAllButNotYou(websocket, clients, string) {
    clients.forEach((client) => {
      if (client.token !== websocket.token) {
        client.send(string);
      }
    });
  }
}
export default WSServer;
