import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezonePlugin from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezonePlugin)

export const log = (label) => (decoratedFn) => {
  return (event, context) => {

      console.log(label + ' input: ' + JSON.stringify(event))

      const result = decoratedFn(event, context)

      console.log(label + ' output: ' + JSON.stringify(result))

      return result
  }
}

export const memo = () => {
  const cache: { [k: string]: any } = {};
  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const cacheKey = `__cacheKey__${args.toString()}`;
      if (!cache.hasOwnProperty(cacheKey)) {
        cache[cacheKey] = originalMethod.apply(this, args);
      }
      return cache[cacheKey];
    }
  }
}

const formatTime = (date: Dayjs, tz = 'America/New_York') => date.tz(tz).format('YYYY-MM-DDTHH:mm:ssZ')

const logSuccess = (method: Function, start: Dayjs, result: any) => {
  const end = dayjs()
  console.log(`[${formatTime(end)}] ${method.name}: ${end.diff(start)}ms`)
  return result
}

const logFailure = (method: Function, start: Dayjs, error: Error) => {
  const end = dayjs()
  console.error(`[${formatTime(end)}] ${method.name} failed:`, error)
  throw error
}

export const measure = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  const originalMethod = descriptor.value

  descriptor.value = function(...args: any[]) {
    const start = dayjs()
    const result = originalMethod.apply(this, args)
    if (result instanceof Promise) {
      return result
        .then((res: any) => logSuccess(originalMethod, start, res))
        .catch((error: any) => logFailure(originalMethod, start, error))
    } else {
      return logSuccess(originalMethod, start, result)
    }
  }

  return descriptor
}
