<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import AppIcon from '@/components/AppIcon.vue'
import ParticleNetwork from '@/components/ParticleNetwork.vue'

import slide1 from '@/assets/carousel/slide1.jpg'
import slide2 from '@/assets/carousel/slide2.jpg'
import slide3 from '@/assets/carousel/slide3.jpg'
import slide4 from '@/assets/carousel/slide4.jpg'

import conceptBgImg from '@/assets/home/concept-bg.jpg'
import capabilityBgImg from '@/assets/home/capability-bg.png'

const conceptBg = conceptBgImg
const capabilityBg = capabilityBgImg

const conceptItems = [
  { title: '可信数据空间', desc: '让数据可协作，但始终可控', tone: 'primary' },
  { title: '全维数据集', desc: '让患者全周期数据真正连起来', tone: 'accent' },
  { title: 'AI 友好', desc: '让数据从可用走向可训练、可复用', tone: 'violet' },
]

const capabilityValues = [
  { label: '安全合规', tone: 'primary' },
  { label: '标准统一', tone: 'accent' },
  { label: '高质量数据', tone: 'violet' },
  { label: '敏捷协同', tone: 'blue' },
  { label: '智能驱动', tone: 'primary' },
]

const quickLinks = [
  {
    title: '患者主档案',
    desc: '以患者为中心的主索引、诊断、分期与治疗时间轴',
    icon: 'user',
    to: '/dataset/patients',
    tone: 'primary'
  },
  {
    title: '专病检索',
    desc: '按条件组合检索患者队列，构建可复用研究 Cohort',
    icon: 'search',
    to: '/dataset/retrieval',
    tone: 'accent'
  },
  {
    title: '数据集',
    desc: '可用于联邦学习的本地数据集（不出域）',
    icon: 'coin',
    to: '/dataset/datasets',
    tone: 'violet'
  },
  {
    title: '联邦任务',
    desc: '联邦学习任务的创建、训练看板与模型评估',
    icon: 'cpu',
    to: '/federated/list',
    tone: 'blue'
  },
]

const slides = [
  { image: slide1, caption: '食管癌专病数据中枢' },
  { image: slide2, caption: '全程合规与主权管控' },
  { image: slide3, caption: '多中心联邦协作训练' },
  { image: slide4, caption: '食管癌早筛智能预警' },
]

const activeSlide = ref(0)
let slideTimer: number | undefined

function nextSlide() {
  activeSlide.value = (activeSlide.value + 1) % slides.length
}

function prevSlide() {
  activeSlide.value = (activeSlide.value - 1 + slides.length) % slides.length
}

function goToSlide(index: number) {
  activeSlide.value = index
  resetSlideTimer()
}

function resetSlideTimer() {
  if (slideTimer) clearInterval(slideTimer)
  slideTimer = window.setInterval(nextSlide, 6000)
}

onMounted(() => {
  slideTimer = window.setInterval(nextSlide, 6000)
})

onBeforeUnmount(() => {
  if (slideTimer) clearInterval(slideTimer)
})
</script>

<template>
  <div class="portal">

    <section class="hero">
      <div class="hero__bg" aria-hidden="true">
        <ParticleNetwork />
      </div>

      <div class="hero__inner">
        <span class="hero__eyebrow rise" style="--delay: .05s">
          TRUSTED · 可信数据空间
        </span>

        <h1 class="hero__title rise" style="--delay: .15s">
          食管癌全维专病<span class="hl">联邦学习</span>平台
        </h1>

        <p class="hero__sub rise" style="--delay: .28s">
          数据可用不可见，价值安全流转 —— 多机构在数据不出域的前提下，协同训练食管癌专病模型。
        </p>

        <div class="hero__badges rise" style="--delay: .4s">
          <span class="badge">
            <AppIcon name="shield" tone="primary" />
            已通过 CA 认证
          </span>

          <span class="badge">
            <AppIcon name="lock" tone="accent" />
            数据不出域
          </span>

          <span class="badge">
            <AppIcon name="network" tone="violet" />
            28 家机构协同
          </span>
        </div>
      </div>
    </section>

    <section class="showcase" v-reveal>
      <div class="showcase__viewport">
        <div
          class="showcase__track"
          :style="{ transform: `translateX(-${activeSlide * 100}%)` }"
        >
          <div
            v-for="(slide, index) in slides"
            :key="index"
            class="showcase__slide"
          >
            <img
              :src="slide.image"
              :alt="slide.caption"
              class="showcase__img"
            />
          </div>
        </div>

        <button
          class="showcase__arrow showcase__arrow--prev"
          @click="prevSlide(); resetSlideTimer()"
        >
          <el-icon><ArrowRight /></el-icon>
        </button>

        <button
          class="showcase__arrow showcase__arrow--next"
          @click="nextSlide(); resetSlideTimer()"
        >
          <el-icon><ArrowRight /></el-icon>
        </button>

        <div class="showcase__dots">
          <button
            v-for="(_, index) in slides"
            :key="index"
            class="showcase__dot"
            :class="{ 'is-active': index === activeSlide }"
            @click="goToSlide(index)"
          />
        </div>
      </div>
    </section>

    <section class="concepts" v-reveal>
      <div class="concept-hero">
        <img
          :src="conceptBg"
          alt="平台设计理念"
          class="concept-hero__img"
        />

        <div class="concept-hero__overlay">
          <div class="concept-hero__head">
            <h2 class="section-tech-title">
              平台设计理念
            </h2>
          </div>

          <div class="concept-hero__items">
            <div
              v-for="(item, index) in conceptItems"
              :key="item.title"
              class="concept-hero__item"
              :class="'concept-hero__item--pos-' + (index + 1)"
              :style="{ '--delay': index * .08 + 's' }"
            >
              <div class="concept-hero__copy">
                <h3 class="concept-hero__item-title">
                  {{ item.title }}
                </h3>

                <p class="concept-hero__item-desc">
                  {{ item.desc }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="capability" v-reveal>
      <div class="capability-hero">
        <img
          :src="capabilityBg"
          alt="从数据接入到 AI 应用"
          class="capability-hero__img"
        />

        <div class="capability-hero__overlay">
          <div class="capability-hero__head">
            <h2 class="section-tech-title">
              从数据接入到
              <span>AI</span>
              应用
            </h2>
          </div>

          <div class="capability-hero__values">
            <div
              v-for="item in capabilityValues"
              :key="item.label"
              class="capability-hero__value"
              :class="'capability-hero__value--' + item.tone"
            >
              <i class="capability-hero__dot" />
              {{ item.label }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="quick" v-reveal>
      <div class="quick__head">
        <h2 class="section-tech-title">
          功能入口
        </h2>
      </div>

      <div class="quick-grid">
        <router-link
          v-for="item in quickLinks"
          :key="item.title"
          :to="item.to"
          class="quick-card"
          :class="'quick-card--' + item.tone"
        >
          <div class="quick-card__icon">
            <AppIcon
              :name="item.icon"
              :tone="item.tone"
            />
          </div>

          <div class="quick-card__main">
            <h3 class="quick-card__title">
              {{ item.title }}
            </h3>

            <p class="quick-card__desc">
              {{ item.desc }}
            </p>
          </div>

          <span class="quick-card__arrow">
            <el-icon><ArrowRight /></el-icon>
          </span>
        </router-link>
      </div>
    </section>

  </div>
</template>

<style scoped>
.portal {
  --font-tech:
    "HarmonyOS Sans SC",
    "MiSans",
    "PingFang SC",
    "Microsoft YaHei",
    sans-serif;

  display: flex;
  flex-direction: column;
  gap: 22px;

  font-family: var(--font-tech);
  color: #172238;
  -webkit-font-smoothing: antialiased;
}

/* 主模块标题：这次变化会比较明显 */
.section-tech-title {
  margin: 0;

  font-family: var(--font-tech);
  font-size: clamp(32px, 2.65vw, 40px);
  font-weight: 900;
  line-height: 1.08;

  letter-spacing: -2px;

  background:
    linear-gradient(
      105deg,
      #111c31 0%,
      #1c2c4b 62%,
      #334d7b 100%
    );

  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;

  filter:
    drop-shadow(
      0 3px 8px rgba(39, 71, 128, .09)
    );
}

.section-tech-title span {
  background:
    linear-gradient(
      110deg,
      #1677ff,
      #4f46e5 55%,
      #8b5cf6
    );

  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* HERO */

.hero {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  padding: 56px 24px 26px;

  background:
    radial-gradient(
      120% 120% at 80% -10%,
      rgba(99,102,241,.22),
      transparent 55%
    ),
    radial-gradient(
      120% 120% at 20% 110%,
      rgba(6,182,212,.18),
      transparent 55%
    ),
    linear-gradient(
      135deg,
      #060819,
      #0b1030 45%,
      #110f33
    );
}

.hero__bg {
  position: absolute;
  inset: 0;
}

.hero__inner {
  position: relative;
  z-index: 1;

  display: flex;
  flex-direction: column;
  align-items: center;

  text-align: center;
}

.hero__eyebrow {
  padding: 6px 14px;

  border: 1px solid rgba(169,180,255,.35);
  border-radius: 999px;

  background: rgba(99,102,241,.12);

  color: #b2bbff;

  font-size: 12px;
  font-weight: 700;
  letter-spacing: .14em;
}

.hero__title {
  margin: 18px 0 14px;

  color: #fff;

  font-size: clamp(34px, 4.3vw, 50px);
  font-weight: 900;

  line-height: 1.1;
  letter-spacing: -2.2px;
}

.hero__title .hl {
  margin: 0 4px;

  background:
    linear-gradient(
      110deg,
      #a9b4ff,
      #22d3ee,
      #8b5cf6
    );

  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero__sub {
  max-width: 680px;
  margin: 0;

  color: #c5cdea;

  font-size: 15px;
  font-weight: 450;
  line-height: 1.75;
}

.hero__badges {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  justify-content: center;

  margin-top: 27px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 9px 15px;

  border: 1px solid rgba(255,255,255,.16);
  border-radius: 999px;

  background: rgba(255,255,255,.08);

  color: #e5e9ff;

  font-size: 13px;
  font-weight: 600;

  backdrop-filter: blur(6px);
}

.badge :deep(.app-icon) {
  width: 18px;
  height: 18px;
}

/* 轮播 */

.showcase {
  width: 100%;
  background: transparent;
}

.showcase__viewport {
  position: relative;

  width: 100%;

  overflow: hidden;
  border-radius: 18px;
}

.showcase__track {
  display: flex;
  width: 100%;

  transition:
    transform .7s
    cubic-bezier(.16,1,.3,1);
}

.showcase__slide {
  flex: 0 0 100%;
  width: 100%;
  overflow: hidden;
}

.showcase__img {
  display: block;

  width: 100%;
  height: auto;

  transform: scale(1.035);
  transform-origin: center;
}

.showcase__arrow {
  position: absolute;
  top: 50%;
  z-index: 6;

  width: 46px;
  height: 46px;

  display: grid;
  place-items: center;

  padding: 0;

  border: 1px solid rgba(255,255,255,.85);
  border-radius: 50%;

  background: rgba(255,255,255,.9);
  color: #64748b;

  cursor: pointer;

  box-shadow:
    0 8px 24px rgba(42,63,112,.14);

  backdrop-filter: blur(10px);
}

.showcase__arrow--prev {
  left: 18px;
  transform: translateY(-50%) rotate(180deg);
}

.showcase__arrow--next {
  right: 18px;
  transform: translateY(-50%);
}

.showcase__dots {
  position: absolute;
  left: 50%;
  bottom: 14px;
  z-index: 6;

  transform: translateX(-50%);

  display: flex;
  gap: 7px;

  padding: 7px 11px;

  border-radius: 999px;

  background: rgba(255,255,255,.85);

  backdrop-filter: blur(8px);
}

.showcase__dot {
  width: 8px;
  height: 8px;

  padding: 0;

  border: 0;
  border-radius: 50%;

  background: #cbd5e1;

  cursor: pointer;
}

.showcase__dot.is-active {
  width: 22px;

  border-radius: 999px;

  background:
    linear-gradient(
      90deg,
      #6366f1,
      #8b5cf6
    );
}

/* 理念 & 能力大图 */

.concept-hero,
.capability-hero {
  position: relative;

  width: 100%;

  overflow: hidden;

  border: 1px solid var(--pf-border);
  border-radius: 18px;

  background: #f6f8fc;

  box-shadow: var(--pf-shadow-sm);
}

.concept-hero__img,
.capability-hero__img {
  display: block;

  width: 100%;

  aspect-ratio: 2.16 / 1;

  object-fit: cover;
}

.concept-hero__overlay,
.capability-hero__overlay {
  position: absolute;
  inset: 0;

  pointer-events: none;
}

.concept-hero__overlay::after,
.capability-hero__overlay::after {
  content: "";

  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;

  height: 33%;

  background:
    linear-gradient(
      to top,
      rgba(255,255,255,.92),
      rgba(255,255,255,.42) 52%,
      transparent
    );
}

.concept-hero__head,
.capability-hero__head {
  position: absolute;

  top: 38px;
  left: 44px;

  z-index: 2;
}

/* 三个理念 */

.concept-hero__items {
  position: absolute;
  inset: 0;

  z-index: 2;
}

.concept-hero__item {
  position: absolute;
  bottom: 24px;

  width: 390px;

  transform: translateX(-50%);

  text-align: center;

  opacity: 0;

  animation:
    conceptItemUp .8s
    cubic-bezier(.22,1,.36,1)
    forwards;

  animation-delay: var(--delay);
}

.concept-hero__item--pos-1 {
  left: 18%;
}

.concept-hero__item--pos-2 {
  left: 50%;
}

.concept-hero__item--pos-3 {
  left: 77%;
}

.concept-hero__item-title {
  margin: 0;

  color: #172238;

  font-size: clamp(23px, 1.6vw, 27px);
  font-weight: 900;

  line-height: 1.25;

  letter-spacing: -1.3px;

  text-shadow:
    0 2px 8px rgba(40,70,120,.08);
}

.concept-hero__item-desc {
  margin: 8px 0 0;

  color: #687891;

  font-size: 15px;
  font-weight: 500;

  line-height: 1.55;
}

/* AI 能力底部标签 */

.capability-hero__values {
  position: absolute;

  left: 0;
  right: 0;
  bottom: 27px;

  z-index: 2;

  display: flex;
  justify-content: center;

  gap: 14px;
}

.capability-hero__value {
  display: inline-flex;
  align-items: center;

  gap: 7px;

  padding: 7px 15px;

  border: 1px solid rgba(148,163,184,.25);
  border-radius: 999px;

  background: rgba(255,255,255,.88);

  color: #4c5b73;

  font-size: 12.5px;
  font-weight: 700;

  backdrop-filter: blur(6px);
}

.capability-hero__dot {
  width: 7px;
  height: 7px;

  border-radius: 50%;
}

.capability-hero__value--primary .capability-hero__dot {
  background: #2563eb;
}

.capability-hero__value--accent .capability-hero__dot {
  background: #06b6d4;
}

.capability-hero__value--violet .capability-hero__dot {
  background: #8b5cf6;
}

.capability-hero__value--blue .capability-hero__dot {
  background: #3b82f6;
}

/* 功能入口 */

.quick {
  padding: 8px 0 3px;
}

.quick__head {
  margin-bottom: 22px;
}

.quick-grid {
  display: grid;

  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 18px;
}

.quick-card {
  display: flex;
  align-items: center;

  gap: 15px;

  min-height: 112px;

  padding: 20px;

  border: 1px solid rgba(148,163,184,.22);
  border-radius: 16px;

  background:
    linear-gradient(
      145deg,
      #fff,
      #f9fbff
    );

  box-shadow:
    0 10px 24px -20px
    rgba(30,41,59,.35);

  text-decoration: none;

  transition: .25s ease;
}

.quick-card:hover {
  transform: translateY(-3px);

  border-color:
    rgba(79,70,229,.25);

  box-shadow:
    0 16px 28px -20px
    rgba(51,65,85,.45);
}

.quick-card__icon {
  flex: none;

  width: 48px;
  height: 48px;

  display: grid;
  place-items: center;

  border: 1px solid rgba(148,163,184,.14);
  border-radius: 13px;
}

.quick-card--primary .quick-card__icon {
  background: rgba(99,102,241,.08);
}

.quick-card--accent .quick-card__icon {
  background: rgba(6,182,212,.08);
}

.quick-card--violet .quick-card__icon {
  background: rgba(139,92,246,.08);
}

.quick-card--blue .quick-card__icon {
  background: rgba(59,130,246,.08);
}

.quick-card__icon :deep(.app-icon) {
  width: 25px;
  height: 25px;
}

.quick-card__main {
  flex: 1;
  min-width: 0;
}

.quick-card__title {
  margin: 0 0 5px;

  color: #172238;

  font-size: 16px;
  font-weight: 850;

  line-height: 1.35;

  letter-spacing: -.55px;
}

.quick-card__desc {
  margin: 0;

  color: #68778e;

  font-size: 13px;
  font-weight: 500;

  line-height: 1.55;
}

.quick-card__arrow {
  flex: none;

  width: 28px;
  height: 28px;

  display: grid;
  place-items: center;

  color: #9aa7bb;

  border-radius: 50%;

  transition: .25s;
}

.quick-card:hover .quick-card__arrow {
  color: #4f46e5;

  background: rgba(79,70,229,.07);

  transform: translateX(2px);
}

@media (max-width: 1080px) {
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .concept-hero__head,
  .capability-hero__head {
    top: 28px;
    left: 30px;
  }

  .concept-hero__item {
    width: 300px;
  }
}

@media (max-width: 720px) {
  .concept-hero__img,
  .capability-hero__img {
    aspect-ratio: 16 / 9;
  }

  .concept-hero__overlay,
  .capability-hero__overlay {
    position: relative;

    background:
      linear-gradient(
        #f8fafc,
        #f1f5f9
      );
  }

  .concept-hero__overlay::after,
  .capability-hero__overlay::after {
    display: none;
  }

  .concept-hero__head,
  .capability-hero__head {
    position: relative;

    top: auto;
    left: auto;

    padding: 24px 22px 4px;
  }

  .concept-hero__items {
    position: relative;

    display: grid;
    grid-template-columns: 1fr;

    gap: 22px;

    padding: 22px;
  }

  .concept-hero__item {
    position: relative;

    left: auto !important;
    bottom: auto;

    width: 100%;

    opacity: 1;
    transform: none;
    animation: none;
  }

  .capability-hero__values {
    position: relative;

    left: auto;
    right: auto;
    bottom: auto;

    flex-wrap: wrap;
    justify-content: flex-start;

    padding: 18px 22px 26px;
  }
}

@media (max-width: 560px) {
  .quick-grid {
    grid-template-columns: 1fr;
  }

  .section-tech-title {
    font-size: 28px;
  }

  .hero {
    padding: 40px 18px 22px;
  }

  .hero__title {
    font-size: 32px;
  }
}

.rise {
  opacity: 0;

  animation:
    heroUp .9s
    cubic-bezier(.22,1,.36,1)
    forwards;

  animation-delay: var(--delay);
}

@keyframes heroUp {
  from {
    opacity: 0;
    transform: translateY(26px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes conceptItemUp {
  from {
    opacity: 0;
    transform:
      translateX(-50%)
      translateY(22px);
  }

  to {
    opacity: 1;
    transform:
      translateX(-50%)
      translateY(0);
  }
}
</style>