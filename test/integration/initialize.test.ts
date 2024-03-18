/* eslint-disable @typescript-eslint/no-unused-vars */

import { Router as IttyRouter, RouterType } from "itty-router";
import {
  AnnotatedCache,
  AnnotatedCacheStorage,
  AnnotatedDatastore,
  AnnotatedRouter,
  Cache,
  CacheStorage,
  Config,
  Controller,
  Datastore,
  Delete,
  Get,
  Head,
  Inject,
  Options,
  Patch,
  Post,
  Property,
  Purge,
  Put,
  RequestHandler,
  Router,
  initialize,
} from "../../src";

describe("Initialization", () => {
  it("fails when router is not configured", () => {
    expect(() => initialize({})).toThrow();
  });

  it("works when router is configured", () => {
    const container = {};

    @Router(container)
    class TestRouter implements AnnotatedRouter {
      options(_uri: string, _handler: RequestHandler): AnnotatedRouter {
        throw new Error("Method not implemented.");
      }
      head(_uri: string, _handler: RequestHandler): AnnotatedRouter {
        throw new Error("Method not implemented.");
      }
      get(_uri: string, _handler: RequestHandler): AnnotatedRouter {
        throw new Error("Method not implemented.");
      }
      put(_uri: string, _handler: RequestHandler): AnnotatedRouter {
        throw new Error("Method not implemented.");
      }
      post(_uri: string, _handler: RequestHandler): AnnotatedRouter {
        throw new Error("Method not implemented.");
      }
      patch(_uri: string, _handler: RequestHandler): AnnotatedRouter {
        throw new Error("Method not implemented.");
      }
      delete(_uri: string, _handler: RequestHandler): AnnotatedRouter {
        throw new Error("Method not implemented.");
      }
      all(_uri: string, _handler: RequestHandler): AnnotatedRouter {
        throw new Error("Method not implemented.");
      }
      handle(_req: Request): Promise<Response> {
        throw new Error("Method not implemented.");
      }
    }

    expect(() => initialize(container)).not.toThrow();
  });

  it("returns a functioning request handler", async () => {
    const container = {};

    @Config(container)
    class TestConfig {
      @Property("IttyRouter")
      getIttyRouter() {
        return IttyRouter();
      }
    }

    @Router(container)
    class TestRouter implements AnnotatedRouter {
      @Inject("IttyRouter")
      private accessor ittyRouter: RouterType;

      options(uri: string, handler: RequestHandler): AnnotatedRouter {
        this.ittyRouter.options(uri, handler);
        return this;
      }

      head(uri: string, handler: RequestHandler): AnnotatedRouter {
        this.ittyRouter.head(uri, handler);
        return this;
      }

      get(uri: string, handler: RequestHandler): AnnotatedRouter {
        this.ittyRouter.get(uri, handler);
        return this;
      }

      put(uri: string, handler: RequestHandler): AnnotatedRouter {
        this.ittyRouter.put(uri, handler);
        return this;
      }

      post(uri: string, handler: RequestHandler): AnnotatedRouter {
        this.ittyRouter.post(uri, handler);
        return this;
      }

      patch(uri: string, handler: RequestHandler): AnnotatedRouter {
        this.ittyRouter.patch(uri, handler);
        return this;
      }

      delete(uri: string, handler: RequestHandler): AnnotatedRouter {
        this.ittyRouter.delete(uri, handler);
        return this;
      }

      all(_uri: string, _handler: RequestHandler): AnnotatedRouter {
        throw new Error("Method not implemented.");
      }

      handle(request: Request) {
        return this.ittyRouter.handle(request);
      }
    }

    const cacheHeader = "cached";

    class TestCache implements AnnotatedCache {
      private map = new Map<string, Response>();

      async match(request: Request): Promise<Response | undefined> {
        let response = this.map.get(request.url);

        if (response) {
          response = new Response(response.body, {
            headers: { [cacheHeader]: "true" },
          });
        }

        return response;
      }

      async put(request: Request, response: Response): Promise<undefined> {
        this.map.set(request.url, response);
      }

      async delete(request: Request): Promise<boolean> {
        return this.map.delete(request.url);
      }
    }

    @CacheStorage(container)
    class TestCacheStorage implements AnnotatedCacheStorage {
      private map = new Map<string, AnnotatedCache>();

      async has(cacheName: string): Promise<boolean> {
        return this.map.has(cacheName);
      }

      async open(cacheName: string): Promise<AnnotatedCache> {
        if (this.map.has(cacheName)) {
          return this.map.get(cacheName) as AnnotatedCache;
        }

        const cache = new TestCache();
        this.map.set(cacheName, cache);
        return cache;
      }

      async delete(cacheName: string): Promise<boolean> {
        return this.map.delete(cacheName);
      }
    }

    @Datastore(container)
    class TestDatastore implements AnnotatedDatastore<string> {
      private map = new Map<string, string>();

      length: number = 0;

      async clear(): Promise<undefined> {
        this.map.clear();
        this.length = 0;
      }

      async getItem(keyName: string): Promise<string | null> {
        return this.map.get(keyName) || null;
      }

      async key(index: number): Promise<string | null> {
        return [...this.map.keys()].at(index) || null;
      }

      async removeItem(keyName: string): Promise<undefined> {
        const keyExisted = this.map.has(keyName);

        this.map.delete(keyName);

        if (!keyExisted) {
          this.length--;
        }
      }

      async setItem(keyName: string, value: string): Promise<undefined> {
        const keyExisted = this.map.has(keyName);

        this.map.set(keyName, value);

        if (!keyExisted) {
          this.length++;
        }
      }
    }

    const expectedGetAllBody = "getAll";
    const cacheName = "cacheName";
    const allowedMethods = "OPTIONS, HEAD, GET, POST, PUT, PATCH, DELETE";

    @Controller("/controller", container)
    class TestController {
      private static KEY = "key";

      @Inject(TestDatastore)
      private accessor datastore: AnnotatedDatastore<string>;

      @Options()
      async options() {
        return new Response(null, {
          status: 204,
          headers: { Allow: allowedMethods },
        });
      }

      @Head()
      async head() {
        return new Response(null, { status: 204 });
      }

      @Get()
      async getAll() {
        return new Response(expectedGetAllBody);
      }

      @Cache(cacheName)
      @Get("get")
      async get() {
        const text = await this.datastore.getItem(TestController.KEY);
        return new Response(text);
      }

      @Delete()
      async delete() {
        return new Response(null, { status: 204 });
      }

      @Patch()
      async patch() {
        return new Response(null, { status: 204 });
      }

      @Post()
      async post(req: Request) {
        const text = await req.text();
        await this.datastore.setItem(TestController.KEY, text);
        return new Response(null, { status: 201 });
      }

      @Purge(cacheName)
      @Put()
      async put() {
        return new Response(null, { status: 204 });
      }
    }

    const handle = initialize(container);

    const optionsResponse = await handle(
      new Request("https://test.com/controller", { method: "OPTIONS" }),
    );
    expect(optionsResponse).toBeDefined();
    expect(optionsResponse.status).toBe(204);
    expect(optionsResponse.headers.get("Allow")).toBe(allowedMethods);

    const headResponse = await handle(
      new Request("https://test.com/controller", { method: "HEAD" }),
    );
    expect(headResponse).toBeDefined();
    expect(headResponse.status).toBe(204);

    const getAllResponse = await handle(
      new Request("https://test.com/controller"),
    );
    expect(getAllResponse).toBeDefined();

    const getAllBody = await getAllResponse.text();
    expect(getAllBody).toBe(expectedGetAllBody);

    const expectedGetBody = "get";

    const postResponse: Response = await handle(
      new Request("https://test.com/controller", {
        method: "POST",
        body: expectedGetBody,
      }),
    );

    expect(postResponse).toBeDefined();
    expect(postResponse.status).toBe(201);

    let getResponse = await handle(
      new Request("https://test.com/controller/get"),
    );
    expect(getResponse).toBeDefined();
    expect(getResponse.headers.get(cacheHeader)).toBeFalsy();

    getResponse = await handle(new Request("https://test.com/controller/get"));
    expect(getResponse).toBeDefined();
    expect(getResponse.headers.get(cacheHeader)).toBeTruthy();

    const getBody = await getResponse.text();
    expect(getBody).toBe(expectedGetBody);

    const deleteResponse: Response = await handle(
      new Request("https://test.com/controller", { method: "DELETE" }),
    );

    expect(deleteResponse).toBeDefined();
    expect(deleteResponse.status).toBe(204);

    const patchResponse: Response = await handle(
      new Request("https://test.com/controller", { method: "PATCH" }),
    );

    expect(patchResponse).toBeDefined();
    expect(patchResponse.status).toBe(204);

    const putResponse: Response = await handle(
      new Request("https://test.com/controller", { method: "PUT" }),
    );

    expect(putResponse).toBeDefined();
    expect(putResponse.status).toBe(204);

    getResponse = await handle(new Request("https://test.com/controller/get"));
    expect(getResponse).toBeDefined();
    expect(getResponse.headers.get(cacheHeader)).toBeFalsy();
  });

  it("Initialize twice expects returns error on second init", () => {
    const container = {};

    @Router(container)
    class TestRouter implements AnnotatedRouter {
      get(_uri: string, _handler: RequestHandler): AnnotatedRouter {
        throw new Error("Method not implemented.");
      }
      put(_uri: string, _handler: RequestHandler): AnnotatedRouter {
        throw new Error("Method not implemented.");
      }
      post(_uri: string, _handler: RequestHandler): AnnotatedRouter {
        throw new Error("Method not implemented.");
      }
      patch(_uri: string, _handler: RequestHandler): AnnotatedRouter {
        throw new Error("Method not implemented.");
      }
      delete(_uri: string, _handler: RequestHandler): AnnotatedRouter {
        throw new Error("Method not implemented.");
      }
      all(_uri: string, _handler: RequestHandler): AnnotatedRouter {
        throw new Error("Method not implemented.");
      }
      handle(_req: Request): Promise<Response> {
        throw new Error("Method not implemented.");
      }
    }

    initialize(container);
    expect(() => initialize(container)).toThrow;
  });
});
