#!/usr/bin/env node

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const rootDir = __dirname
const cliArgs = process.argv.slice(2)
const useMockBackend = cliArgs.includes('--mock-backend')
const backendPortArg = cliArgs.find((arg) => arg.startsWith('--backend-port='))
const frontendPortArg = cliArgs.find((arg) => arg.startsWith('--frontend-port='))
const isWin = process.platform === 'win32'
const npmCommand = isWin ? 'npm.cmd' : 'npm'

const backendPort = backendPortArg
  ? backendPortArg.split('=')[1]
  : process.env.PORT || process.env.DEV_BACKEND_PORT || '5000'

const frontendPort = frontendPortArg
  ? frontendPortArg.split('=')[1]
  : process.env.DEV_FRONTEND_PORT || '5173'

const defaultBackendHost = process.env.HOST || process.env.DEV_BACKEND_HOST || '127.0.0.1'
const frontendHost = process.env.DEV_FRONTEND_HOST || process.env.VITE_DEV_HOST || '127.0.0.1'

const backendEnv = { ...process.env }
if (!backendEnv.HOST) {
  backendEnv.HOST = defaultBackendHost
}
if (!backendEnv.PORT) {
  backendEnv.PORT = backendPort
}
if (!backendEnv.FRONTEND_URL) {
  backendEnv.FRONTEND_URL = `http://${frontendHost}:${frontendPort}`
}

const frontendEnv = { ...process.env }
if (!frontendEnv.VITE_DEV_PORT) {
  frontendEnv.VITE_DEV_PORT = String(frontendPort)
}
if (!frontendEnv.VITE_BACKEND_PORT) {
  frontendEnv.VITE_BACKEND_PORT = String(backendPort)
}
if (!frontendEnv.VITE_BACKEND_HOST) {
  frontendEnv.VITE_BACKEND_HOST = backendEnv.HOST || defaultBackendHost
}
if (!frontendEnv.VITE_DEV_HOST) {
  frontendEnv.VITE_DEV_HOST = frontendHost
}
if (!frontendEnv.VITE_API_URL) {
  frontendEnv.VITE_API_URL = `http://${frontendEnv.VITE_BACKEND_HOST}:${backendPort}/api`
}

const services = [
  {
    name: 'backend',
    cwd: path.join(rootDir, 'backend'),
    command: npmCommand,
    args: ['run', useMockBackend ? 'dev:mock' : 'dev'],
    env: backendEnv,
  },
  {
    name: 'frontend',
    cwd: path.join(rootDir, 'frontend'),
    command: npmCommand,
    args: ['run', 'dev'],
    env: frontendEnv,
  },
]

const children = []
let shuttingDown = false

function runNpmCommand(service, npmArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(service.command, npmArgs, {
      cwd: service.cwd,
      stdio: 'inherit',
      env: { ...process.env },
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${service.name} npm ${npmArgs.join(' ')} exited with code ${code}`))
      }
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}

async function ensureDependencies() {
  for (const service of services) {
    const nodeModulesPath = path.join(service.cwd, 'node_modules')
    if (fs.existsSync(nodeModulesPath)) {
      console.log(`[dev-runner] ${service.name} dependencies already installed`)
      continue
    }

    console.log(`[dev-runner] Installing ${service.name} dependencies...`)
    await runNpmCommand(service, ['install'])
    console.log(`[dev-runner] ${service.name} dependencies installed`)
  }
}

function pipeStream(stream, label, targetStream) {
  let buffer = ''
  stream.on('data', (chunk) => {
    buffer += chunk.toString()
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop()
    for (const line of lines) {
      targetStream.write(`[${label}] ${line}\n`)
    }
  })

  stream.on('end', () => {
    if (buffer.length > 0) {
      targetStream.write(`[${label}] ${buffer}\n`)
    }
  })
}

function startService({ name, command, args, cwd, env }) {
  // Merge provided env with the current process env to avoid missing essentials on Windows
  const mergedEnv = { ...process.env, ...(env || {}) }

  // On Windows, prefer spawning via a shell and inheriting stdio to avoid EINVAL issues
  const spawnOptions = isWin
    ? {
        cwd,
        env: mergedEnv,
        shell: true,
        stdio: 'inherit',
      }
    : {
        cwd,
        env: mergedEnv,
        stdio: ['inherit', 'pipe', 'pipe'],
      }

  let child
  try {
    child = spawn(command, args, spawnOptions)
  } catch (error) {
    console.error(`[${name}] failed to spawn:`, error.message)
    shutdown(1)
    return
  }

  children.push(child)

  if (!isWin) {
    // Only pipe on non-Windows where we used explicit pipes
    pipeStream(child.stdout, name, process.stdout)
    pipeStream(child.stderr, name, process.stderr)
  }

  child.on('exit', (code, signal) => {
    const reason = signal ? `signal ${signal}` : `code ${code}`
    console.log(`[${name}] exited with ${reason}`)
    if (!shuttingDown && code !== 0) {
      console.error(`[dev-runner] ${name} exited unexpectedly. Shutting down others...`)
      shutdown(1)
    }
  })

  child.on('error', (error) => {
    console.error(`[${name}] failed to start:`, error.message)
    if (!shuttingDown) {
      shutdown(1)
    }
  })
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true
  console.log('\n[dev-runner] Stopping services...')
  for (const child of children) {
    if (!child.killed) {
      child.kill()
    }
  }
  // Give child processes a moment to exit cleanly
  setTimeout(() => {
    process.exit(exitCode)
  }, 200)
}

process.on('SIGINT', () => {
  console.log('\n[dev-runner] Caught SIGINT (Ctrl+C).')
  shutdown(0)
})

process.on('SIGTERM', () => {
  console.log('\n[dev-runner] Caught SIGTERM.')
  shutdown(0)
})

async function main() {
  try {
    await ensureDependencies()
  } catch (error) {
    console.error('[dev-runner] Failed to install dependencies:', error.message)
    process.exit(1)
  }

  if (useMockBackend) {
    console.log('[dev-runner] Using backend script "dev:mock"')
  }

  console.log(`[dev-runner] Backend port: ${backendEnv.PORT}, Frontend port: ${frontendEnv.VITE_DEV_PORT}`)

  console.log('[dev-runner] Starting backend and frontend dev servers...')
  services.forEach(startService)
}

main()
