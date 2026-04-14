'use client'

import { useState, useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { TileData } from '../page'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FolderTileContent, FolderOverlay } from './FolderTile'

interface TileProps {
  tile: TileData
  index: number
  moveTile: (dragIndex: number, hoverIndex: number) => void
  updateTile: (updatedTile: TileData) => void
  deleteTile: (id: string) => void
}

export default function Tile({ tile, index, moveTile, updateTile, deleteTile }: TileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTile, setEditedTile] = useState(tile)
  const [isFolderOpen, setIsFolderOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const [{ handlerId }, drop] = useDrop<{ index: number }, void, { handlerId: string | symbol | null }>({
    accept: 'tile',
    collect(monitor) {
      return { handlerId: monitor.getHandlerId() }
    },
    drop(item) {
      if (item.index !== index) {
        moveTile(item.index, index)
      }
    },
  })

  const [{ isDragging: isCurrentlyDragging }, drag] = useDrag({
    type: 'tile',
    item: () => ({ id: tile.id, index }),
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  })

  drag(drop(ref))

  const handleClick = (e: React.MouseEvent) => {
    if (!isCurrentlyDragging && !e.defaultPrevented) {
      if (tile.type === 'folder') {
        setIsFolderOpen(true)
      } else {
        window.open(tile.url, '_blank')
      }
    }
  }

  const handleSave = () => {
    updateTile({ ...editedTile, position: tile.position })
    setIsEditing(false)
  }

  const isFolder = tile.type === 'folder'

  return (
    <>
      <div
        ref={ref}
        onClick={handleClick}
        style={{ backgroundColor: tile.backgroundColor || (isFolder ? '#2563eb' : 'white') }}
        className={`group relative rounded-2xl cursor-move aspect-square w-full h-full
          transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.35)] hover:scale-[1.03]
          ${isCurrentlyDragging ? 'opacity-50 scale-95' : ''}`}
        data-handler-id={handlerId}
      >
        <div className="flex flex-col items-center justify-center h-full w-full">
          {isFolder ? (
            <FolderTileContent tile={tile} />
          ) : tile.displayMode === 'icon' ? (
            tile.icon && (
              <img
                src={tile.icon}
                alt="Icon"
                className="w-4/5 h-4/5 object-contain transition-transform duration-200 group-hover:scale-105"
                draggable={false}
              />
            )
          ) : (
            <span className="text-3xl font-bold text-center w-full px-2 break-words leading-tight">
              {tile.text}
            </span>
          )}
        </div>

        {/* macOS-style control dots */}
        <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); deleteTile(tile.id) }}
            className="w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF4A47] transition-colors duration-200 shadow-sm flex items-center justify-center group/btn"
          >
            <span className="opacity-0 group-hover/btn:opacity-100 text-[8px] text-[#800000]">×</span>
          </button>
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setEditedTile(tile); setIsEditing(true) }}
            className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:bg-[#FFB214] transition-colors duration-200 shadow-sm flex items-center justify-center group/btn"
          >
            <span className="opacity-0 group-hover/btn:opacity-100 text-[8px] text-[#805B17]">●</span>
          </button>
        </div>
      </div>

      {/* Folder overlay */}
      {isFolder && (
        <FolderOverlay
          tile={tile}
          isOpen={isFolderOpen}
          onClose={() => setIsFolderOpen(false)}
          updateTile={updateTile}
        />
      )}

      {/* Edit dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>{isFolder ? 'Edit Folder' : 'Edit Tile'}</DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {isFolder ? (
              /* ── Folder edit: just rename + background ── */
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Folder Name</label>
                  <Input
                    value={editedTile.folderName || ''}
                    onChange={e => setEditedTile({ ...editedTile, folderName: e.target.value })}
                    placeholder="My Folder"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Background Color</label>
                  <Input
                    type="color"
                    value={editedTile.backgroundColor || '#4a7dbd'}
                    onChange={e => setEditedTile({ ...editedTile, backgroundColor: e.target.value })}
                    className="h-10 cursor-pointer"
                  />
                </div>
              </>
            ) : (
              /* ── Link edit ── */
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">URL</label>
                  <Input
                    type="url"
                    value={editedTile.url}
                    onChange={e => setEditedTile({ ...editedTile, url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Display Mode</label>
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    {(['icon', 'text'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setEditedTile({ ...editedTile, displayMode: mode })}
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium capitalize transition-all duration-150
                          ${editedTile.displayMode === mode
                            ? 'bg-white shadow-sm text-gray-900'
                            : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {editedTile.displayMode === 'icon' ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Icon URL</label>
                    <Input
                      value={editedTile.icon}
                      onChange={e => setEditedTile({ ...editedTile, icon: e.target.value })}
                      placeholder="/icons/example.png"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Display Text</label>
                    <Input
                      value={editedTile.text || ''}
                      onChange={e => setEditedTile({ ...editedTile, text: e.target.value })}
                      placeholder="Text"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Background Color</label>
                  <Input
                    type="color"
                    value={editedTile.backgroundColor || '#ffffff'}
                    onChange={e => setEditedTile({ ...editedTile, backgroundColor: e.target.value })}
                    className="h-10 cursor-pointer"
                  />
                </div>

                {editedTile.icon && editedTile.displayMode === 'icon' && (
                  <div
                    className="h-24 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: editedTile.backgroundColor }}
                  >
                    <img
                      src={editedTile.icon}
                      alt="Preview"
                      className="h-16 w-16 object-contain"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} className="bg-gray-900 hover:bg-gray-800 text-white px-5">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
