import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../../logger/logger.service';
import { Hl7Service } from './hl7.service';
import { KafkaProducerService } from './kafka-producer.service';

jest.mock('./kafka-producer.service');
jest.mock('@nestjs/axios');

describe('Hl7Service', () => {
  let service: Hl7Service;
  let kafkaProducerService: KafkaProducerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Hl7Service,
        KafkaProducerService,
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              post: jest.fn(() => ({
                data: { fhirResource: { resourceType: 'Bundle' } },
              })),
            },
          },
        },
        {
          provide: LoggerService,
          useValue: { error: jest.fn(), log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<Hl7Service>(Hl7Service);
    kafkaProducerService =
      module.get<KafkaProducerService>(KafkaProducerService);
    httpService = module.get<HttpService>(HttpService);
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send ADT message payload with retry on Kafka', async () => {
    const hl7Msg = 'ADT Message';
    jest
      .spyOn(kafkaProducerService, 'sendPayloadWithRetryDMQ')
      .mockImplementation(() => Promise.resolve());

    await service.handleAdtMessage(hl7Msg);

    expect(kafkaProducerService.sendPayloadWithRetryDMQ).toHaveBeenCalledWith(
      { message: hl7Msg },
      expect.anything(),
    );
  });

  it('should send ORU message if translation is successful', async () => {
    const hl7Msg = 'ORU Message';
    const expectedBundle = { resourceType: 'Bundle', entry: [{}] }; // Assume successful translation
    jest.spyOn(service, 'translateBundle').mockResolvedValue(expectedBundle);

    const result = await service.handleOruMessage(hl7Msg);

    expect(kafkaProducerService.sendPayload).toHaveBeenCalledWith(
      { bundle: expectedBundle },
      expect.anything(),
    );
    expect(result).toEqual(expectedBundle);
  });

  it('should return error bundle on translation failure', async () => {
    const hl7Msg = 'ORU Message';
    jest
      .spyOn(service, 'translateBundle')
      .mockResolvedValue(Hl7Service.errorBundle);

    const result = await service.handleOruMessage(hl7Msg);

    expect(result).toEqual(Hl7Service.errorBundle);
  });

  it('should retry translation on failure and succeed on retry', async () => {
    const hl7Msg = 'Message needing retry';
    const mockErrorBundle = Hl7Service.errorBundle;
    const mockSuccessBundle = { resourceType: 'Bundle', entry: [{}] };
    const mockFunc = jest
      .fn()
      .mockResolvedValueOnce(mockErrorBundle)
      .mockResolvedValueOnce(mockSuccessBundle);

    jest.spyOn(service, 'getHl7Translation').mockImplementation(mockFunc);

    const result = await service.translateBundle(hl7Msg, 'someKey');

    expect(mockFunc).toHaveBeenCalledTimes(2);
    expect(result).toEqual(mockSuccessBundle);
  });
});
