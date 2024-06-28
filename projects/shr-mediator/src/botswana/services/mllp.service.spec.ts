import { Test, TestingModule } from '@nestjs/testing';
import { MllpService } from './mllp.service';
import { Hl7Service } from './hl7.service';
import { LoggerService } from '../../logger/logger.service';

const mllpMock = {
  listen: jest.fn().mockImplementation((callback) => callback()),
  on: jest.fn(),
  send: jest.fn((_ip, _port, _message, callback) => callback(null, 'ACK')),
};

jest.mock('@i-tech-uw/mllp-server', () => {
  return {
    MllpServer: jest.fn().mockImplementation(() => mllpMock),
  };
});

describe('MllpService', () => {
  let service: MllpService;
  let mockHl7Service: Hl7Service;
  let mockLogger: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MllpService,
        {
          provide: Hl7Service,
          useValue: { handleMessage: jest.fn() },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MllpService>(MllpService);
    mockHl7Service = module.get<Hl7Service>(Hl7Service);
    mockLogger = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should start MLLP server on module initialization', () => {
    service.onModuleInit();
    expect(mllpMock.listen).toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith(expect.any(String));
  });

  it('should handle HL7 messages', async () => {
    const mockData = 'MSH|^~\\&|...|...|||...|\rPID|...|...|\r';
    jest
      .spyOn(mockHl7Service, 'handleMessage')
      .mockResolvedValue({ resourceType: 'Bundle' });

    mllpMock.on.mockImplementation((event, callback) => {
      if (event === 'hl7') {
        callback(mockData);
      }
    });
    service.onModuleInit();
    expect(mockHl7Service.handleMessage).toHaveBeenCalledWith(mockData);
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining('TCP Server is up and listening'),
    );
  });

  it('should log an error for malformed HL7 messages', async () => {
    const malformedData = 'MSH|^~\\&|...|...|||...|PID|...|...|';
    mllpMock.on.mockImplementation((event, callback) => {
      if (event === 'hl7') {
        callback(malformedData);
      }
    });

    service.onModuleInit();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Malformed HL7 Message'),
    );
  });

  it('should send HL7 message and handle response', async () => {
    const message = 'MSH|^~\\&|...|...|||...|\r';

    service.onModuleInit();
    await expect(service.send(message, '127.0.0.1', 1234, 2)).resolves.toBe(
      'ACK',
    );
    expect(mllpMock.send).toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining('Successfully sent HL7 message'),
    );
  });

  it('should reject on send error', async () => {
    mllpMock.send.mockImplementation((ip, port, msg, callback) =>
      callback('error', null),
    );

    service.onModuleInit();
    await expect(
      service.send('MSH|^~\\&|...|...|||...|\r'),
    ).rejects.toMatchObject({ error: 'error' });
    expect(mockLogger.log).toHaveBeenCalledWith(
      expect.stringContaining('err: error'),
    );
  });
});
