import { Injectable } from '@nestjs/common';
import { Message } from '@stranded-ii-fanpage/api-interfaces';

@Injectable()
export class AppService {
  getData(): Message {
    return { message: 'Welcome to api!' };
  }
}
