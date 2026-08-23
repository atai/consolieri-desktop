import './about.css'
import logoUrl from './logo-on-dark.svg?url'

declare global {
  interface Window {
    aboutApi: {
      getMeta: () => Promise<{ name: string; version: string; mode: 'splash' | 'about' }>
      onProgress: (cb: (payload: { label: string; detail?: string }) => void) => () => void
      close: () => void
    }
  }
}

const logoEl = document.getElementById('logo') as HTMLImageElement
const nameEl = document.getElementById('name')!
const versionEl = document.getElementById('version')!
const progressEl = document.getElementById('progress')!
const detailEl = document.getElementById('detail')!
const closeBtn = document.getElementById('close') as HTMLButtonElement

logoEl.src = logoUrl

void window.aboutApi.getMeta().then((meta) => {
  nameEl.textContent = meta.name
  versionEl.textContent = `Version ${meta.version}`
  document.title = meta.mode === 'about' ? `About ${meta.name}` : meta.name

  if (meta.mode === 'splash') {
    progressEl.classList.remove('hidden')
    progressEl.textContent = 'Starting…'
  } else {
    closeBtn.classList.remove('hidden')
  }
})

window.aboutApi.onProgress(({ label, detail }) => {
  progressEl.classList.remove('hidden')
  progressEl.textContent = label
  if (detail) {
    detailEl.classList.remove('hidden')
    detailEl.textContent = detail
  } else {
    detailEl.classList.add('hidden')
    detailEl.textContent = ''
  }
})

closeBtn.addEventListener('click', () => {
  window.aboutApi.close()
})

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return
  if (closeBtn.classList.contains('hidden')) return
  window.aboutApi.close()
})
