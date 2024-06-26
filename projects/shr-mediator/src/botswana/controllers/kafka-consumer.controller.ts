import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';

@Controller()
export class KafkaConsumerController {
  @MessagePattern('message.print') // The Kafka topic
  receiveMessage(data: any) {
    console.log(data.value); // Process the received message
  }
}
