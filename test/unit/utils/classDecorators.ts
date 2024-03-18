/* eslint-disable @typescript-eslint/no-explicit-any */

import { keys } from "../../../src/container/keys";
import { MetadataProperties } from "../../../src/decorators/inject/metadataProperties";
import { Class, ClassDecorator } from "../../../src/decorators/types";

export const initializerFor =
  (classDef: Class<any>) => (initializer: () => void) =>
    initializer.call(classDef);

const kind = "class";
const name = "name";
class ExampleClass {}

export const itExpectsAValidContainer = <T extends Class<any>>(
  getClassDecorator: (container: Record<string, any>) => ClassDecorator<T>,
) =>
  it("expects a valid container", () => {
    // @ts-expect-error passing an invalid container
    expect(() => getClassDecorator(null)()).toThrow();
  });

export const itThrowsErrorIfNotUsedOnAClass = <T extends Class<any>>(
  getClassDecorator: (container: Record<string, any>) => ClassDecorator<T>,
) =>
  it("throws an error when not used on a class", () => {
    expect(() =>
      // @ts-expect-error Class type is too broad for anonymous class
      getClassDecorator({})(class {}, {
        kind: "method",
      }),
    ).toThrow();
  });

export const itHasInitializationHook = <T extends Class<any>>(
  getClassDecorator: (container: Record<string, any>) => ClassDecorator<T>,
) =>
  it("has an initialization hook", () => {
    const spy = jest.fn();

    getClassDecorator({})(
      // @ts-expect-error Class type is too broad for anonymous class
      class {},
      {
        kind,
        name,
        addInitializer: spy,
        metadata: {},
      },
    );

    expect(spy).toHaveBeenCalledWith(expect.any(Function));
  });

export const itDoesNotCreateClassIntanceBeforeInit = <T extends Class<any>>(
  getClassDecorator: (container: Record<string, any>) => ClassDecorator<T>,
  prefilledContainer?: Record<string, any>,
) =>
  it("does not create class instance before initialization", () => {
    const spy = jest.fn();

    getClassDecorator(
      Object.assign({}, prefilledContainer, { [keys.initializing]: false }),
    )(
      // @ts-expect-error Class type is too broad for anonymous class
      class {},
      {
        kind,
        name,
        addInitializer: initializerFor(
          class {
            constructor() {
              spy();
            }
          },
        ),
        metadata: {},
      },
    );

    expect(spy).not.toHaveBeenCalled();
  });

export const itCreatesClassInstanceInInitHook = <T extends Class<any>>(
  getClassDecorator: (container: Record<string, any>) => ClassDecorator<T>,
  prefilledContainer?: Record<string, any>,
) =>
  it("initialization hook to create instance of class", () => {
    const spy = jest.fn();

    getClassDecorator(
      Object.assign({}, prefilledContainer, { [keys.initializing]: true }),
    )(
      // @ts-expect-error Class type is too broad for anonymous class
      class {},
      {
        kind,
        name,
        addInitializer: initializerFor(
          class {
            constructor() {
              spy();
            }
          },
        ),
        metadata: {},
      },
    );

    expect(spy).toHaveBeenCalled();
  });

export const itDoesNotSetInjectablesBeforeInit = <T extends Class<any>>(
  getClassDecorator: (container: Record<string, any>) => ClassDecorator<T>,
  prefilledContainer?: Record<string, any>,
) =>
  it("does not set injectables before initialization", () => {
    const set = jest.fn();
    class ExampleClass {}

    getClassDecorator(
      Object.assign({}, prefilledContainer, { [keys.initializing]: false }),
    )(
      // @ts-expect-error Class type is too broad for anonymous class
      class {},
      {
        kind,
        name,
        addInitializer: initializerFor(ExampleClass),
        metadata: {
          [MetadataProperties.injectables]: [{ key: "key", set }],
        },
      },
    );

    expect(set).not.toHaveBeenCalled();
  });

export const itSetsInjectablesOnInstance = <T extends Class<any>>(
  getClassDecorator: (container: Record<string, any>) => ClassDecorator<T>,
) =>
  it("sets injectables on class instance", () => {
    const key = "key";
    const value = null;

    const set = jest.fn();
    class ExampleClass {}

    getClassDecorator({ [key]: value, [keys.initializing]: true })(
      // @ts-expect-error Class type is too broad for anonymous class
      class {},
      {
        kind,
        name,
        addInitializer: initializerFor(ExampleClass),
        metadata: {
          [MetadataProperties.injectables]: [{ key, set }],
        },
      },
    );

    expect(set).toHaveBeenCalledWith(expect.any(ExampleClass), value);
  });

export const itAddsClassToArrayInContainer = <T extends Class<any>>(
  getClassDecorator: (container: Record<string, any>) => ClassDecorator<T>,
  key: string,
) =>
  it("adds class to array in container", () => {
    const container = {};

    getClassDecorator(container)(
      // @ts-expect-error Class type is too broad for anonymous class
      class {},
      {
        kind,
        name,
        addInitializer: () => {},
        metadata: {},
      },
    );

    expect(container[key]).toStrictEqual(
      expect.arrayContaining([expect.anything()]),
    );
  });

export const itAddsClassToContainer = <T extends Class<any>>(
  getClassDecorator: (container: Record<string, any>) => ClassDecorator<T>,
  key: string,
) =>
  it("adds class to container", () => {
    const container = {};

    getClassDecorator(container)(
      // @ts-expect-error Class type is too broad for anonymous class
      class {},
      {
        kind,
        name,
        addInitializer: () => {},
        metadata: {},
      },
    );

    expect(container[key]).toBeDefined();
  });

export const itAddsClassToContainerOnlyOnce = <T extends Class<any>>(
  getClassDecorator: (container: Record<string, any>) => ClassDecorator<T>,
) =>
  it("adds class to container only once", () => {
    const container = {};
    const addInitializer = () => {};
    const metadata = {};

    getClassDecorator(container)(
      // @ts-expect-error Class type is too broad for anonymous class
      ExampleClass,
      {
        kind,
        name,
        addInitializer,
        metadata,
      },
    );

    expect(() =>
      getClassDecorator(container)(
        // @ts-expect-error Class type is too broad for anonymous class
        ExampleClass,
        { kind, name, addInitializer, metadata },
      ),
    ).toThrow();
  });

export const itAddsClassInstanceToContainerOnInit = <T extends Class<any>>(
  name: string,
  getClassDecorator: (container: Record<string, any>) => ClassDecorator<T>,
  key: string,
) =>
  it("adds class instance to container when initialized", () => {
    const container = { [keys.initializing]: true };

    getClassDecorator(container)(
      // @ts-expect-error Class type is too broad for anonymous class
      ExampleClass,
      {
        kind,
        name,
        addInitializer: initializerFor(ExampleClass),
        metadata: {},
      },
    );

    expect(container[key]).toStrictEqual(expect.any(ExampleClass));
  });

export const itDoesNotAddClassInstanceBeforeInit = <T extends Class<any>>(
  name: string,
  getClassDecorator: (container: Record<string, any>) => ClassDecorator<T>,
  key: string,
) =>
  it("does not add class instance to container before initialization", () => {
    const container = {};

    getClassDecorator(container)(
      // @ts-expect-error Class type is too broad for anonymous class
      class {},
      {
        kind,
        name,
        addInitializer: initializerFor(class {}),
        metadata: {},
      },
    );

    expect(container[key]).not.toBeDefined();
  });

export const itThrowsWhenUsedOnAnUnnamedClass = <T extends Class<any>>(
  getClassDecorator: (container: Record<string, Array<T>>) => ClassDecorator<T>,
) =>
  it("errors if context name is undefined", () => {
    expect(() =>
      // @ts-expect-error Class type is too broad for anonymous class
      getClassDecorator({})(class {}, {
        kind,
        name: undefined,
        addInitializer: () => {},
        metadata: {},
      }),
    ).toThrow();
  });
