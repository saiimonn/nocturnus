'use client'

import { useEffect, useRef, useCallback } from 'react'

const SCROLLBAR_WIDTH = 3
const HIDE_DELAY = 1200

export default function CustomScrollbar() {
  const thumbRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)
  const hideTimerRef = useRef(0)
  const draggingRef = useRef(false)
  const dragStartY = useRef(0)
  const dragStartScroll = useRef(0)
  const lastScrollY = useRef(0)

  const getMaxScroll = useCallback(() => {
    return document.documentElement.scrollHeight - window.innerHeight
  }, [])

  const updateThumb = useCallback(() => {
    const thumb = thumbRef.current
    if (!thumb) return

    const maxScroll = getMaxScroll()
    if (maxScroll <= 0) {
      thumb.style.opacity = '0'
      return
    }

    const viewportH = window.innerHeight
    const thumbH = Math.max(20, (viewportH / (viewportH + maxScroll)) * viewportH)
    const scrollY = document.documentElement.scrollTop
    const scrollProgress = scrollY / maxScroll
    const thumbY = scrollProgress * (viewportH - thumbH)

    thumb.style.height = `${thumbH}px`
    thumb.style.transform = `translateY(${thumbY}px)`

    if (!draggingRef.current && scrollY !== lastScrollY.current) {
      lastScrollY.current = scrollY
      showThumb()
    }
  }, [getMaxScroll])

  const showThumb = useCallback(() => {
    const thumb = thumbRef.current
    if (!thumb) return
    thumb.style.opacity = '1'
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = window.setTimeout(() => {
      if (!draggingRef.current && thumb) {
        thumb.style.opacity = '0'
      }
    }, HIDE_DELAY)
  }, [])

  const onDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    draggingRef.current = true
    dragStartY.current = e.clientY
    dragStartScroll.current = document.documentElement.scrollTop
    const thumb = thumbRef.current
    if (thumb) {
      thumb.style.opacity = '1'
      thumb.setPointerCapture(e.pointerId)
    }
  }, [])

  const onDragMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return
    const deltaY = e.clientY - dragStartY.current
    const maxScroll = getMaxScroll()
    const viewportH = window.innerHeight
    const thumbH = Math.max(20, (viewportH / (viewportH + maxScroll)) * viewportH)
    const scrollableThumbTrack = viewportH - thumbH
    if (scrollableThumbTrack <= 0) return
    const scrollDelta = (deltaY / scrollableThumbTrack) * maxScroll
    document.documentElement.scrollTop = dragStartScroll.current + scrollDelta
    updateThumb()
  }, [getMaxScroll, updateThumb])

  const onDragEnd = useCallback(() => {
    draggingRef.current = false
    showThumb()
  }, [showThumb])

  const onTrackClick = useCallback((e: React.PointerEvent) => {
    const track = e.currentTarget as HTMLElement
    const rect = track.getBoundingClientRect()
    const clickY = e.clientY - rect.top
    const maxScroll = getMaxScroll()
    const viewportH = window.innerHeight
    const ratio = clickY / viewportH
    document.documentElement.scrollTop = ratio * maxScroll
    updateThumb()
  }, [getMaxScroll, updateThumb])

  useEffect(() => {
    lastScrollY.current = document.documentElement.scrollTop
    const tick = () => {
      updateThumb()
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(hideTimerRef.current)
    }
  }, [updateThumb])

  return (
    <div
      className="fixed top-0 right-0 z-50 h-full cursor-pointer"
      style={{ width: SCROLLBAR_WIDTH }}
      onClick={onTrackClick}
    >
      <div
        ref={thumbRef}
        className="w-full bg-white opacity-0 transition-opacity duration-300"
        style={{ willChange: 'transform, opacity' }}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
      />
    </div>
  )
}
