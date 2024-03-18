/* eslint-disable @typescript-eslint/no-unused-vars */

import { Inject, Service } from "../../src";
import { isInitializing } from "../../src/container/utils/isInitializing";

describe("Service", () => {
  it("should not work when it does not have @Service annotation", () => {
    expect(() => {
      class TestService {}

      @Service({})
      class OtherService {
        @Inject(TestService)
        private accessor service: TestService;
      }
    }).toThrow();
  });

  it("should work when service has @Service annotation", () => {
    expect(() => {
      const container = {};

      if (isInitializing(container)) {
        return;
      }

      @Service(container)
      class TestService {}

      @Service(container)
      class OtherService {
        @Inject(TestService)
        private accessor service: TestService;
      }
    }).not.toThrow();
  });
});
