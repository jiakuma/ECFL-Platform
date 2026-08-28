import type { Directive } from 'vue'

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        ;(entry.target as HTMLElement).classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }
  },
  { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
)

export const vReveal: Directive<HTMLElement> = {
  mounted(el) {
    el.classList.add('reveal')
    observer.observe(el)
  },
  unmounted(el) {
    observer.unobserve(el)
  },
}
