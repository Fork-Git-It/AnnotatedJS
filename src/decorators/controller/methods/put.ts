import { RequestHandler } from "../../../interfaces/types";
import { ClassMethodDecorator } from "../../types";
import { getHttpMethod } from "./getHttpMethod";

/**
 * A class method decorator that specifies a PUT endpoint
 *
 * @see {@link Controller} for example
 *
 * @param path - API endpoint path (optional)
 */
export const Put: (
  path?: string,
) => // @ts-expect-error request handler type does not conform to T type
ClassMethodDecorator<RequestHandler> = getHttpMethod("Put");
