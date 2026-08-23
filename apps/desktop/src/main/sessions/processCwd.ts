import { execFile } from 'child_process'
import { readlink } from 'fs/promises'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

/** Resolve the current working directory of a process by PID. */
export async function getProcessCwd(pid: number): Promise<string | null> {
  if (!Number.isInteger(pid) || pid <= 0) return null

  if (process.platform === 'linux') {
    try {
      return await readlink(`/proc/${pid}/cwd`)
    } catch {
      return null
    }
  }

  if (process.platform === 'darwin') {
    try {
      const { stdout } = await execFileAsync('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], {
        encoding: 'utf8'
      })
      for (const line of stdout.split('\n')) {
        if (line.startsWith('n')) {
          const path = line.slice(1).trim()
          if (path) return path
        }
      }
    } catch {
      return null
    }
  }

  return null
}
