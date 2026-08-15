import { describe, expect, it } from 'vitest'
import { parseControlWindowRecipe, RecipeValidationError, recipeHasCommand } from './recipes'

describe('control recipes', () => {
  it('parses a valid ephemeral recipe', () => {
    const recipe = parseControlWindowRecipe({
      key: 'dev-manager:demo',
      title: 'Demo',
      panes: [
        {
          title: 'API',
          cwd: '/tmp/api',
          localShell: 'bash'
        }
      ]
    })
    expect(recipe.key).toBe('dev-manager:demo')
    expect(recipe.panes[0].cwd).toBe('/tmp/api')
    expect(recipeHasCommand(recipe)).toBe(false)
  })

  it('rejects relative cwd', () => {
    expect(() =>
      parseControlWindowRecipe({
        title: 'Bad',
        panes: [{ title: 'x', cwd: 'relative/path' }]
      })
    ).toThrow(RecipeValidationError)
  })

  it('rejects hostId on recipe or panes', () => {
    expect(() =>
      parseControlWindowRecipe({
        title: 'Bad',
        hostId: 'abc',
        panes: [{ title: 'x', cwd: '/tmp' }]
      })
    ).toThrow(/hostId/)

    expect(() =>
      parseControlWindowRecipe({
        title: 'Bad',
        panes: [{ title: 'x', cwd: '/tmp', hostId: 'abc' }]
      })
    ).toThrow(/hostId/)
  })

  it('detects command panes', () => {
    const recipe = parseControlWindowRecipe({
      title: 'Logs',
      panes: [{ title: 'x', cwd: '/tmp', command: 'docker logs -f' }]
    })
    expect(recipeHasCommand(recipe)).toBe(true)
  })

  it('rejects too many panes', () => {
    expect(() =>
      parseControlWindowRecipe({
        title: 'Many',
        panes: Array.from({ length: 17 }, (_, i) => ({
          title: `p${i}`,
          cwd: `/tmp/p${i}`
        }))
      })
    ).toThrow()
  })
})
