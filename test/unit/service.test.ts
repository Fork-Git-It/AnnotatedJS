import { MetadataProperties } from "../../src/decorators/inject/metadataProperties";
import { Service } from "../../src/index";
import {
  initializerFor,
  itCreatesClassInstanceInInitHook,
  itCreatesInstanceOfClass,
  itHasInitializationHook,
} from "./utils";

describe("Service", () => {
  const kind = "class";
  const name = "Service";

  itCreatesInstanceOfClass(name, Service({}));
  itHasInitializationHook(name, Service({}));
  itCreatesClassInstanceInInitHook(name, Service({}));

  it("initialization hook creates an instance of the class", () => {
    const spy = jest.fn();

    Service({})(class {}, {
      kind,
      name,
      addInitializer: jest.fn(
        initializerFor(
          class {
            constructor() {
              spy();
            }
          }
        )
      ),
      metadata: {},
    });

    expect(spy).toHaveBeenCalled();
  });

  it("sets injectables on class instance", () => {
    const key = "key";
    const value = null;
    const set = jest.fn();
    class ServiceClass {}

    Service({ [key]: value })(class {}, {
      kind,
      name,
      addInitializer: initializerFor(ServiceClass),
      metadata: {
        [MetadataProperties.injectables]: [{ key, set }],
      },
    });

    expect(set).toHaveBeenCalledWith(expect.any(ServiceClass), value);
  });

  it("sets global value to class instance", () => {
    const container = {};
    const name = "ServiceClass";
    class ServiceClass {}

    Service(container)(class {}, {
      kind,
      name,
      addInitializer: initializerFor(ServiceClass),
      metadata: {},
    });

    expect(container[name]).toStrictEqual(expect.any(ServiceClass));
  });

  it("errors if context name is undefined", () => {
    expect(() =>
      Service({})(class {}, {
        kind,
        name: undefined,
        addInitializer: () => {},
        metadata: {},
      })
    ).toThrow();
  });
});
