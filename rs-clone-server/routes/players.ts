import { v4 as uuid } from 'uuid';
// import { Router } from 'express';
import * as express from 'express';
import * as cors from 'cors';
// import * as jwt from 'jsonwebtoken';
import * as bodyParser from 'body-parser';
// import * as storage from '../storage/mongo';
import * as pg from '../storage/postgre';
// import appConfig from '../app-config';

const app = express();
app.use(cors());

const router = express.Router();

router.use(bodyParser.json());

router.get('/', async (req, res) => {
  const list = await pg.listAll();

  res.json(list);
});

router.get('/:id', async (req, res) => {
  const item = await pg.getById(req.params.id);

  res.status(item ? 200 : 404).json(item ?? { statusCode: 404 });
});

router.post('/', async (req, res) => {
  const id = uuid();

  const { body } = req;

  body.id = id;

  const newBody = await pg.create(body);
  res.json(newBody);
});

router.put('/:id', async (req, res) => {
  const { body } = req;

  const newBody = await pg.update({
    ...body,
    id: req.params.id,
  });

  res.json(newBody);
});

router.delete('/:id', async (req, res) => {
  await pg.remove(req.params.id);

  res.status(204).json(null);
});

export default router;
