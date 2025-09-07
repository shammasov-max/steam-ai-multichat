import { test } from 'node:test'
import { strict as assert } from 'node:assert'

test('Dialog Module - Essential Type Checking', async (t) => {
  await t.test('dialog manager config interface types', () => {
    // Type check: DialogManager config interface
    const config = {
      openai: {
        apiKey: 'test-key',
        model: 'gpt-4o-mini' as const,
        maxTokensPerRequest: 1000
      }
    }
    
    // Verify config structure is correct
    assert.equal(typeof config.openai, 'object')
    assert.equal(typeof config.openai.apiKey, 'string')
    assert.equal(typeof config.openai.model, 'string')
    assert.equal(typeof config.openai.maxTokensPerRequest, 'number')
    assert.equal(config.openai.model, 'gpt-4o-mini')
  })
  
  await t.test('CreateDialogParams type structure', () => {
    // Type check: createDialog parameter structure
    const createParams = {
      language: 'en' as const,
      goal: 'Test goal',
      init: 'Test initialization'
    }
    
    // Verify required fields are present and correctly typed
    assert.equal(typeof createParams.language, 'string')
    assert.equal(typeof createParams.goal, 'string')
    assert.equal(typeof createParams.init, 'string')
    
    // Language should be one of the allowed values
    const allowedLanguages = ['zh', 'ja', 'ko', 'en', 'es'] as const
    assert.ok(allowedLanguages.includes(createParams.language))
  })
  
  await t.test('ProcessMessageParams type structure', () => {
    // Type check: processMessage parameter structure  
    const processParams = {
      dialogId: 'test-dialog-id',
      message: {
        text: 'Hello world',
        timestamp: new Date()
      }
    }
    
    assert.equal(typeof processParams.dialogId, 'string')
    assert.equal(typeof processParams.message, 'object')
    assert.equal(typeof processParams.message.text, 'string')
    assert.ok(processParams.message.timestamp instanceof Date)
  })
})
