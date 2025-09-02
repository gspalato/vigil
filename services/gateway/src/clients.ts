import * as grpc from '@grpc/grpc-js';
import { UnaryCallback } from '@grpc/grpc-js/build/src/client';

import * as AnalyticsService from './generated/analytics_service';

type RpcImpl = (service: string, method: string, data: Uint8Array) => Promise<Uint8Array>;

const sendRequest: (conn: grpc.Client) => RpcImpl = (conn) => (service, method, data) => {
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
    conn.makeUnaryRequest(path, d => Buffer.from(d), passThrough, data, resultCallback);
  });
};

const createRpc = (conn: grpc.Client) => {
  return {
    request: sendRequest(conn),
  };
};

export const AnalyticsServiceRPC = createRpc(new grpc.Client("analytics-service.default.svc.cluster.local:50051", grpc.credentials.createInsecure()));
export const AnalyticsServiceClient = new AnalyticsService.AnalyticsServiceClientImpl(AnalyticsServiceRPC);

