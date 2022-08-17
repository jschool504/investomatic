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

export const measure = (
  target,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => {

  const originalMethod = descriptor.value

  descriptor.value = function (...args) {
    console.time(originalMethod.name)
    const result = originalMethod.apply(this, args)
    Promise.resolve(result).then(() => {
      console.timeEnd(originalMethod.name)
    }).catch(() => {
      console.timeEnd(originalMethod.name)
    })
    return result
  }

  return descriptor
}
