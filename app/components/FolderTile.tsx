'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useDrop } from 'react-dnd'
import { TileData } from '../page'
import Tile from './Tile'
import AddTileForm from './AddTileForm'
import { Plus, X } from 'lucide-react'

const FOLDER_GRID_SIZE = 25 // 5×5

export type DragItem = { index: number; id: string; parentFolderId?: string }

// ─── Empty slot inside folder — accepts drops from within the same folder ────

function FolderEmptySlot({
  idx,
  folderId,
  onMoveTile,
  onAdd,
}: {
  idx: number
  folderId: string
  onMoveTile: (fromIdx: number, toIdx: number) => void
  onAdd: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [{ isOver }, drop] = useDrop<DragItem, object, { isOver: boolean }>({
    accept: 'tile',
    canDrop: item => item.parentFolderId === folderId,
    drop: item => { onMoveTile(item.index, idx); return {} },
    collect: monitor => ({ isOver: monitor.isOver() && monitor.canDrop() }),
  })
  drop(ref)

  return (
    <div
      ref={ref}
      className="w-full h-full aspect-square rounded-2xl flex items-center justify-center group cursor-pointer"
      style={{
        background: isOver ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
        border: `1.5px dashed ${isOver ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.16)'}`,
        transition: 'background 0.15s ease, border-color 0.15s ease',
      }}
      onClick={() => { if (!isOver) onAdd() }}
    >
      <Plus className="w-4 h-4 text-white/25 group-hover:text-white/60 transition-colors duration-150" />
    </div>
  )
}

// ─── Overlay ────────────────────────────────────────────────────────────────

interface FolderOverlayProps {
  tile: TileData
  isOpen: boolean
  onClose: () => void
  updateTile: (updated: TileData) => void
  onMoveToMainGrid: (tileId: string) => void
}

export function FolderOverlay({
  tile, isOpen, onClose, updateTile, onMoveToMainGrid,
}: FolderOverlayProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [addingAtPosition, setAddingAtPosition] = useState<number | null>(null)
  const [addPanelVisible, setAddPanelVisible] = useState(false)

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Mount / visibility animation
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setIsVisible(true)))
    } else {
      setIsVisible(false)
      const t = setTimeout(() => {
        setIsMounted(false)
        setAddingAtPosition(null)
        setAddPanelVisible(false)
      }, 400)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  useEffect(() => {
    if (addingAtPosition !== null) {
      requestAnimationFrame(() => requestAnimationFrame(() => setAddPanelVisible(true)))
    } else {
      setAddPanelVisible(false)
    }
  }, [addingAtPosition])

  // ── Folder tile handlers ──────────────────────────────────────────────────

  const handleMoveTileInFolder = (dragIndex: number, dropIndex: number) => {
    const ft = [...(tile.folderTiles || [])]
    const di = ft.findIndex(t => t.position === dragIndex)
    const dri = ft.findIndex(t => t.position === dropIndex)
    if (di === -1) return
    if (dri !== -1) {
      const tmp = ft[di].position
      ft[di] = { ...ft[di], position: ft[dri].position }
      ft[dri] = { ...ft[dri], position: tmp }
    } else {
      ft[di] = { ...ft[di], position: dropIndex }
    }
    updateTile({ ...tile, folderTiles: ft })
  }

  const handleUpdateInFolder = (updated: TileData) =>
    updateTile({ ...tile, folderTiles: (tile.folderTiles || []).map(t => t.id === updated.id ? updated : t) })

  const handleDeleteFromFolder = (id: string) =>
    updateTile({ ...tile, folderTiles: (tile.folderTiles || []).filter(t => t.id !== id) })

  const handleAddToFolder = (newTileData: Omit<TileData, 'id' | 'position'>) => {
    if (addingAtPosition === null) return
    const newTile: TileData = { ...newTileData, id: Date.now().toString(), position: addingAtPosition }
    updateTile({ ...tile, folderTiles: [...(tile.folderTiles || []), newTile] })
    setAddingAtPosition(null)
  }

  // Panel drop — absorbs drops on panel gaps so they don't trigger "move to main grid"
  const panelRef = useRef<HTMLDivElement>(null)
  const [, panelDrop] = useDrop<DragItem, object, never>({
    accept: 'tile',
    drop: () => ({}), // non-undefined = "handled", prevents end() from firing
  })
  panelDrop(panelRef)

  if (!isMounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        backdropFilter: isVisible ? 'blur(28px) saturate(160%)' : 'blur(0px)',
        backgroundColor: isVisible ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
        transition: 'backdrop-filter 0.38s ease, background-color 0.38s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Folder name */}
      <p
        className="text-white font-semibold mb-6 pointer-events-none select-none"
        style={{
          fontSize: 22,
          letterSpacing: '0.01em',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
          transition: `opacity 0.28s ease ${isVisible ? '0.07s' : '0s'}, transform 0.38s cubic-bezier(0.34,1.56,0.64,1) ${isVisible ? '0.07s' : '0s'}`,
          textShadow: '0 1px 8px rgba(0,0,0,0.4)',
        }}
      >
        {tile.folderName || 'Folder'}
      </p>

      {/* Folder panel */}
      <div
        className="relative"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.80)',
          transition: 'opacity 0.32s ease, transform 0.42s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* panelRef absorbs gaps between tiles */}
        <div
          ref={panelRef}
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(48px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 32,
            boxShadow: '0 40px 100px rgba(0,0,0,0.45), 0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18)',
            padding: 20,
            boxSizing: 'border-box',
            overflow: 'hidden',
            width: 'min(calc(5 * var(--launchpad-tile, 100px) + 4 * 16px + 40px), calc(100vw - 48px))',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {Array(FOLDER_GRID_SIZE).fill(null).map((_, idx) => {
              const t = (tile.folderTiles || []).find(ft => ft.position === idx)
              return (
                <div key={idx} className="aspect-square">
                  {t ? (
                    <Tile
                      tile={t}
                      index={idx}
                      parentFolderId={tile.id}
                      moveTile={handleMoveTileInFolder}
                      updateTile={handleUpdateInFolder}
                      deleteTile={handleDeleteFromFolder}
                      onMoveToMainGrid={onMoveToMainGrid}
                    />
                  ) : (
                    <FolderEmptySlot
                      idx={idx}
                      folderId={tile.id}
                      onMoveTile={handleMoveTileInFolder}
                      onAdd={() => setAddingAtPosition(idx)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3.5 -right-3.5 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{
            background: 'rgba(40,40,40,0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <X className="w-4 h-4 text-white/85" />
        </button>
      </div>

      {/* Add-tile inline panel */}
      {addingAtPosition !== null && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 60 }}
          onClick={() => setAddingAtPosition(null)}
        >
          <div
            className="rounded-3xl shadow-2xl overflow-hidden"
            style={{
              background: 'rgba(250,250,252,0.97)',
              backdropFilter: 'blur(24px)',
              width: 400,
              opacity: addPanelVisible ? 1 : 0,
              transform: addPanelVisible ? 'scale(1) translateY(0)' : 'scale(0.90) translateY(12px)',
              transition: 'opacity 0.22s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-1">
              <h3 className="font-semibold text-gray-900 text-base">Add to Folder</h3>
              <button
                onClick={() => setAddingAtPosition(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
            <AddTileForm addTile={handleAddToFolder} allowFolder={false} />
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}

// ─── Folder tile content: name only, Apple style ────────────────────────────

interface FolderTileContentProps {
  tile: TileData
}

export function FolderTileContent({ tile }: FolderTileContentProps) {
  const name = tile.folderName || 'Folder'
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-2 gap-1.5">
      <svg viewBox="0 0 28 22" fill="none" className="w-6 h-5 flex-shrink-0" aria-hidden>
        <path
          d="M0 4C0 2.9 0.9 2 2 2H10L13 6H26C27.1 6 28 6.9 28 8V20C28 21.1 27.1 22 26 22H2C0.9 22 0 21.1 0 20V4Z"
          fill="white" fillOpacity={0.55}
        />
      </svg>
      <span
        className="text-white text-center leading-tight font-semibold w-full"
        style={{
          fontSize: 11,
          textShadow: '0 1px 4px rgba(0,0,0,0.3)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {name}
      </span>
    </div>
  )
}
