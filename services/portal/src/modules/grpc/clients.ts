import * as grpc from '@grpc/grpc-js';
import { UnaryCallback } from '@grpc/grpc-js/build/src/client';

import * as MLService from '../../generated/ml_service';

type RpcImpl = (
  service: string,
  method: string,
  data: Uint8Array,
) => Promise<Uint8Array>;

const sendRequest: (conn: grpc.Client) => RpcImpl =
  (conn) => (service, method, data) => {
    // Conventionally in gRPC, the request path looks like
    //   "package.names.ServiceName/MethodName",
    // we therefore construct such a string
    const path = `/${service}/${method}`;

    return new Promise((resolve, reject) => {
      // makeUnaryRequest transmits the result (and error) with a callback
      // transform this into a promise!
      const resultCallback: UnaryCallback<any> = (err, res) => {
        if (err) {
          return reject(err);
        }
        resolve(res);
      };

      function passThrough(argument: any) {
        return argument;
      }

      // Using passThrough as the deserialize functions
      conn.makeUnaryRequest(
        path,
        (d) => Buffer.from(d),
        passThrough,
        data,
        resultCallback,
      );
    });
  };

const createRpc = (conn: grpc.Client) => {
  return {
    request: sendRequest(conn),
  };
};

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MLServiceClientImpl } from '../../generated/ml_service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'ML_SERVICE_CLIENT',
      useFactory: (configService: ConfigService): MLServiceClientImpl => {
        const address = configService.get<string>('ML_SERVICE_ADDRESS');

        if (!address)
          throw new Error('Missing ML_SERVICE_ADDRESS environment variable.');

        const MLServiceRPC = createRpc(
          new grpc.Client(
            process.env.ML_SERVICE_ADDRESS!,
            grpc.credentials.createInsecure(),
          ),
        );

        const MLServiceClient = new MLService.MLServiceClientImpl(MLServiceRPC);
        return MLServiceClient;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['ML_SERVICE_CLIENT'], // Export the client for use in other modules
})
export class GRPCModule {}
