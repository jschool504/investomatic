import assert from 'assert'
import { measure } from '.'

describe('measure decorator', () => {
  let originalLog
  let originalError
  let logCount
  let errorCount

  beforeEach(() => {
    originalLog = console.log
    originalError = console.error
    logCount = 0
    errorCount = 0
    console.log = () => logCount++
    console.error = () => errorCount++
  })

  afterEach(() => {
    console.log = originalLog
    console.error = originalError
  })

  it('should log execution time for synchronous methods', () => {
    class TestClass {
      @measure
      syncMethod() {
        return 'success'
      }
    }

    const testObject = new TestClass()
    const result = testObject.syncMethod()

    assert.strictEqual(result, 'success')
    assert.strictEqual(logCount, 1)
  })

  it('should log execution time for asynchronous methods', async () => {
    class TestClass {
      @measure
      async asyncMethod() {
        return new Promise(resolve => setTimeout(() => resolve('success'), 100))
      }
    }

    const testObject = new TestClass()
    const result = await testObject.asyncMethod()

    assert.strictEqual(result, 'success')
    assert.strictEqual(logCount, 1)
  })

  it('should log error for rejected promises', async () => {
    class TestClass {
      @measure
      async asyncMethod() {
        return new Promise((resolve, reject) => setTimeout(() => reject(new Error('error')), 100))
      }
    }

    const testObject = new TestClass()

    try {
      await testObject.asyncMethod()
    } catch (error) {
      assert.strictEqual(error.message, 'error')
      assert.strictEqual(logCount, 0)
      assert.strictEqual(errorCount, 1)
    }
  })
})
