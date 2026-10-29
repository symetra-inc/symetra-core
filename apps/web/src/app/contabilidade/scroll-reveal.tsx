'use client'

import { useEffect } from 'react'

// Revela elementos com [data-reveal] quando entram na tela.
// Só esconde o conteúdo depois que o JS roda, então sem JS a página aparece normal.
export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!('IntersectionObserver' in window)) return

    const root = document.documentElement
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]')

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )

    // Elementos que já estão na tela no carregamento aparecem sem animação de scroll
    els.forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) el.classList.add('is-visible')
      else io.observe(el)
    })
    root.classList.add('reveal-ready')

    return () => io.disconnect()
  }, [])

  return null
}
