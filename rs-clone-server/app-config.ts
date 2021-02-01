export default {
  debugMode: false,
  dbName: 'rs-clone-server',
  collectionName: 'players',
  collectionTokens: 'tokens',
  collectionPlayerSettings: 'player_settings',
  collectionPlayerStatistics: 'player_statistics',
  MONGO_DB_URL: process.env.MONGO_DB_URL || 'mongodb+srv://rsmaincraftserver:rsmaincraftserver2020q3@cluster0.fnt9p.mongodb.net/?retryWrites=true&w=majority',
  TOKEN_KEY: process.env.TOKEN_KEY || '1a2b-3c4d-5e6f-7g8h',
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:@localhost:5432/postgres',
};
// export default {
//   dbName: 'rs-clone-server',
//   collectionName: 'players',
//   MONGO_DB_URL: process.env.MONGO_DB_URL,
//   TOKEN_KEY: process.env.TOKEN_KEY,
//   DATABASE_URL: process.env.DATABASE_URL,
// };
