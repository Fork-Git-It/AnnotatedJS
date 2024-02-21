import normalizePath from "normalize-path";
import { container as defaultContainer } from "../../container/container";
import { keys } from "../../container/keys";
import { getGlobal } from "../../container/utils/getGlobal";
import { validateContainer } from "../../container/utils/validateContainer";
import { AnnotatedCacheStorage } from "../../interfaces/annotatedCacheStorage";
import type { AnnotatedRouter } from "../../interfaces/annotatedRouter";
import { Cache } from "../../interfaces/cache";
import { setInjectables } from "../inject/setInjectables";
import type { Class, ClassDecorator, HttpMethodMetadata } from "../types";
import { addClassToContainer } from "../utils/addClassToContainer";
import { getMetadata } from "../utils/getMetadata";
import { getMetadataProperty } from "../utils/getMetadataProperty";
import { validateKind } from "../utils/validateKind";
import { MetadataProperties } from "./metadataProperties";

/**
 * A class decorator that encapsulates API endpoints
 *
 * @remarks
 *
 * `@Controller` represents a specific API entrypoint. It expects the API path as a parameter
 *
 * The HTTP method annotations `@Get`, `@Put`, `@Post`, `@Patch`, `@Delete` take the API endpoint path as an optional paramater
 *
 * @example
 * ```ts
 * import {
 *   Controller,
 *   Get,
 *   Put,
 *   Post,
 *   Patch,
 *   Delete,
 * } from "@fork-git-it/annotatedjs";
 *
 * @Controller("/items")
 * export class ExampleController {
 *   @Get()
 *   async getItems(req: Request): Promise<Response> {}
 *
 *   @Get("/:id")
 *   async getItem(req: Request): Promise<Response> {}
 *
 *   @Put("/:id")
 *   async putItem(req: Request): Promise<Response> {}
 *
 *   @Post("/:id")
 *   async postItem(req: Request): Promise<Response> {}
 *
 *   @Patch("/:id")
 *   async patchItem(req: Request): Promise<Response> {}
 *
 *   @Delete()
 *   async deleteItems(req: Request): Promise<Response> {}
 *
 *   @Delete("/:id")
 *   async deleteItem(req: Request): Promise<Response> {}
 * }
 * ```
 *
 * @typeParam T - Type of the annotated class
 *
 * @param controllerPath - Base path of the API endpoints
 *
 * @param container - Object that stores injectables
 */
export const Controller = <T extends Class<object>>(
  controllerPath: string,
  container = defaultContainer,
) =>
  ((constructor, context) => {
    validateContainer(container);

    const annotationName = `@${Controller.name}`;
    validateKind(annotationName, context, "class");

    if (typeof controllerPath !== "string") {
      throw new Error(
        `Invalid Controller path argument ${JSON.stringify(
          controllerPath,
        )}. Argument must be a string`,
      );
    }

    if (controllerPath.length === 0) {
      throw new Error("Controller path argument is an empty string");
    }

    context.addInitializer(function () {
      const controller = new this();

      const metadata = getMetadata(annotationName, context);
      setInjectables(container, controller, metadata);

      const methods = <Array<HttpMethodMetadata>>(
        getMetadataProperty(metadata, MetadataProperties.methods, [])
      );

      const controllerMethodMetadata = methods.map((methodMetadata) => ({
        ...methodMetadata,
        handler: methodMetadata.handler.bind(controller),
      }));

      let router: AnnotatedRouter = getGlobal(container, keys.router);
      const cacheStorage: AnnotatedCacheStorage = getGlobal(
        container,
        keys.cacheStorage,
      );
      for (const {
        path: methodPath,
        handler,
        httpMethod,
        cacheName,
      } of controllerMethodMetadata) {
        const routerMethod = <Exclude<keyof AnnotatedRouter, "handle">>(
          httpMethod.toLowerCase()
        );

        if (typeof router[routerMethod] !== "function") {
          throw new Error(
            `Router is improperly configured. It should include ${routerMethod} method`,
          );
        }

        router = router[routerMethod](
          normalizePath("/" + [controllerPath, methodPath].join("/"), true),
          async (request: Request) => {
            let cache: Cache | undefined;
            if (cacheName) {
              cache = await cacheStorage.open(cacheName);

              const response = await cache.match(request);
              if (response) {
                return response;
              }
            }

            const response = await handler.call(controller, request);

            if (cache) {
              await cache.put(request, response);
            }

            return response;
          },
        );
      }
    });

    addClassToContainer(container, keys.controllerClasses, constructor);
  }) as ClassDecorator<T>;
