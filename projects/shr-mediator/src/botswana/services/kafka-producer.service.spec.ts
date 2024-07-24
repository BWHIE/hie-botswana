import { ClientKafka } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { LoggerService } from '../../logger/logger.service';
import { KafkaProducerService } from './kafka-producer.service';

describe('KafkaProducerService', () => {
  let service: KafkaProducerService;
  let clientKafka: ClientKafka;
  let logger: LoggerService;
  let mockProducer;

  beforeEach(async () => {
    mockProducer = {
      connect: jest.fn().mockResolvedValue(undefined),
      transaction: jest.fn().mockResolvedValue({
        send: jest.fn().mockResolvedValue(undefined),
        commit: jest.fn().mockResolvedValue(undefined),
        abort: jest.fn().mockResolvedValue(undefined),
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        KafkaProducerService,
        {
          provide: 'KAFKA_SERVICE',
          useValue: { connect: jest.fn().mockResolvedValue(mockProducer) },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<KafkaProducerService>(KafkaProducerService);
    clientKafka = module.get<ClientKafka>('KAFKA_SERVICE');
    logger = module.get<LoggerService>(LoggerService);

    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should connect to Kafka producer on module initialization', async () => {
      await service.onModuleInit();
      expect(clientKafka.connect).toBeCalled();
      expect(mockProducer.connect).toBeCalled();
    });
  });

  describe('sendPayload', () => {
    it('should send a payload successfully', async () => {
      const payload = { bundle: 'data' };
      const topic = 'test-topic';
      await service.sendPayload(payload, topic);
      expect(logger.log).toBeCalledWith(`Sending payload to topic ${topic}!`);
    });

    it('should throw an error if sending fails', async () => {
      mockProducer.transaction = jest.fn().mockResolvedValue({
        send: jest.fn().mockRejectedValue(new Error('Failed to send')),
        abort: jest.fn(),
      });
      const payload = { bundle: 'data' };
      const topic = 'test-topic';
      await expect(service.sendPayload(payload, topic)).rejects.toThrow(
        'Error sending payload to topic test-topic: Error: Failed to send',
      );
    });
  });

  describe('sendPayloadWithRetryDMQ', () => {
    it('should retry sending payload and eventually send to DMQ after failures', async () => {
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => cb());
      mockProducer.transaction = jest.fn().mockResolvedValue({
        send: jest.fn().mockRejectedValue(new Error('Send failed')),
        abort: jest.fn(),
      });
      const payload = { bundle: 'data' };
      const topic = 'test-topic';
      await expect(
        service.sendPayloadWithRetryDMQ(payload, topic),
      ).rejects.toThrow(
        'Failed to send payload to DMQ: Error: Error sending payload to topic dmq: Error: Send failed',
      );
      expect(logger.error).toHaveBeenCalledTimes(7); // Initial error plus retries
    });
  });
});
