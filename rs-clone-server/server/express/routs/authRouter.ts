import { v4 as uuid } from 'uuid';
import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import * as bodyParser from 'body-parser';
import appConfig from '../../../app-config';
import { PostgreInterface, Postgre } from '../../../storage/postgreModel';
import RoutesInterface from './routesInterface';

class AuthRouter implements RoutesInterface {
  private router: any;

  private postgre: PostgreInterface;

  constructor() {
    this.postgre = new Postgre();
    this.router = express.Router();
    this.router.use(bodyParser.json());
    this.connectRouts();
  }

  public getRouts() {
    return this.router;
  }

  private connectRouts() {
    this.signUp();
    this.login();
  }

  private signUp() {
    this.router.post('/reg/', async (req, res) => {
      const { body } = req;

      const items = await this.postgre.getLogin(body.login);

      if (items === undefined) {
        body.id = uuid();

        const pgResp = await this.postgre.create(body);

        if (pgResp) {
          body.token = jwt.sign({ id: body.id, login: body.login }, appConfig.TOKEN_KEY, { expiresIn: '30d' });
          body.statusCode = 200;
          body.name = body.login;
          res.json(body);
        } else {
          res.json({
            statusCode: 401,
            message: 'DB error',
          });
        }
      } else {
        res.json({
          statusCode: 401,
          message: `the login '${body.login}' is already exist`,
        });
      }
    });
  }

  private login() {
    this.router.post('/login/', async (req, res) => {
      /*
      iss — (issuer) издатель токена
      sub — (subject) "тема", назначение токена
      aud — (audience) аудитория, получатели токена
      exp — (expire time) срок действия токена
      nbf — (not before) срок, до которого токен не действителен
      iat — (issued at) время создания токена 30d (days), 1h (hour)
      jti — (JWT id) идентификатор токена
      */
      if (req.headers.authorization) {
        jwt.verify(req.headers.authorization.split(' ')[1], appConfig.TOKEN_KEY, async (err, payload) => {
          /*
          * if token exist but NOT ok
          */
          if (err) {
            res.json({
              statusCode: 401,
              message: err,
            });
          } else if (payload) {
            /*
            * if token ok
            */
            // eslint-disable-next-line dot-notation
            const item = await this.postgre.getById(payload['id']);
            if (item) {
              res.json({
                statusCode: 200,
                message: 'User is Authorized',
                name: req.body.login,
              });
            } else {
              res.json({
                statusCode: 401,
                message: 'User is NOT Authorized',
              });
            }
          }
        });

      /*
      * if token NOT exist
      */
      } else {
        let isAuthorized: Boolean = false;
        let id: String = '';
        let login: String = '';

        /*
        * if login and pass within the body
        */
        if (req.body.login && req.body.password) {
          const items = await this.postgre.listAll();
          isAuthorized = Object.keys(items).some((element) => {
            if (
              items[element].login === req.body.login
              && items[element].password === req.body.password
            ) {
              id = items[element].id;
              login = items[element].login;
              return true;
            }
            return false;
          });
        }

        if (isAuthorized) {
          res.json({
            statusCode: 200,
            message: 'User is Authorized',
            name: req.body.login,
            token: jwt.sign({ id, login }, appConfig.TOKEN_KEY, { expiresIn: '30d' }),
          });
        } else {
          res.json({
            statusCode: 401,
            message: 'User is NOT Authorized',
          });
        }
      }
    });
  }
}

export default AuthRouter;
