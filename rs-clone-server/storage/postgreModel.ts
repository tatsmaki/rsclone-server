import * as initKnex from 'knex';
import appConfig from '../app-config';
import PostgreInterface from './postgreModelInterface';

type ItemType = {
  id: string;
  password: string;
  login: string;
}

class Postgre implements PostgreInterface {
  private knex: any;

  constructor() {
    this.knex = initKnex({
      client: 'pg',
      connection: appConfig.DATABASE_URL,
      debug: appConfig.debugMode,
    });
  }

  public async listAll() {
    const list = await this.knex(appConfig.collectionName).select();

    return list;
  }

  public async score() {
    const list = await this.knex({
      a: appConfig.collectionName,
      b: appConfig.collectionPlayerStatistics,
    })
      .select({
        'User Name': 'a.login',
        Score: 'b.player_values',
      })
      .whereRaw('?? = ??', ['a.id', 'b.uuid']);

    return list;
  }

  public async getUserScore(uuid: string) {
    const list = await this.knex(appConfig.collectionPlayerStatistics)
      .select('player_values')
      .where({ uuid });

    return list[0];
  }

  // eslint-disable-next-line camelcase
  public async saveUserScore(uuid: string, player_values: string) {
    const list = await this.knex(appConfig.collectionPlayerStatistics)
      .update({ player_values })
      .where({ uuid })
      .returning('*');

    return list[0];
  }

  public async getLogin(userLogin: string) {
    const list = await this.knex(appConfig.collectionName)
      .select()
      .where('login', userLogin);

    return list[0];
  }

  public async getById(id: string) {
    const list = await this.knex(appConfig.collectionName)
      .select()
      .where({ id });

    return list[0];
  }

  public async create(item: ItemType) {
    const { id, password, login } = item;
    const isTransactionOk = await this.knex.transaction((t) => this.knex(appConfig.collectionName)
      .transacting(t)
      .insert({ id, password, login })
      .then(() => this.knex(appConfig.collectionTokens)
        .transacting(t)
        .insert({ uuid: id })
        .then(() => this.knex(appConfig.collectionPlayerSettings)
          .transacting(t)
          .insert({ uuid: id })
          .then(() => this.knex(appConfig.collectionPlayerStatistics)
            .transacting(t)
            .insert({ uuid: id }))))
      .then(t.commit)
      .catch(t.rollback))
      .then(() => true)
      .catch(() => false);

    return isTransactionOk;
  }

  public async setToken(uuid: any, token: any) {
    const list = await this.knex(appConfig.collectionTokens)
      .update({ token })
      .where({ uuid })
      .returning('*');

    return list[0];
  }

  public async updatePassword(id: any, password: any) {
    const list = await this.knex(appConfig.collectionName)
      .update({ password })
      .where({ id })
      .returning('*');

    return list[0];
  }

  public async logOutById(uuid: any) {
    const token = null;
    const list = await this.knex(appConfig.collectionTokens)
      .update({ token })
      .where({ uuid })
      .returning('*');

    return list[0];
  }

  public async update(item: ItemType) {
    const { id, password, login } = item;

    const list = await this.knex(appConfig.collectionName)
      .update({ id, password, login })
      .where({ id })
      .returning('*');

    return list[0];
  }

  public async remove(id: string) {
    if (!id) {
      return;
    }

    await this.knex(appConfig.collectionName)
      .delete()
      .where({ id });
  }
}
export { PostgreInterface, Postgre };
