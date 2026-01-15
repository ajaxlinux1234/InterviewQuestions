import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { UserToken } from './entities/user-token.entity';
import { Instrument } from './entities/instrument.entity';
import { InstrumentCategory } from './entities/instrument-category.entity';
import { InstrumentBrand } from './entities/instrument-brand.entity';
import { Contact } from './entities/contact.entity';
import { Conversation } from './entities/conversation.entity';
import { ConversationMember } from './entities/conversation-member.entity';
import { Message } from './entities/message.entity';
import { AiRequestLog } from './entities/ai-request-log.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  username: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'im_service',
  entities: [
    User,
    UserToken,
    Instrument,
    InstrumentCategory,
    InstrumentBrand,
    Contact,
    Conversation,
    ConversationMember,
    Message,
    AiRequestLog,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false,
});