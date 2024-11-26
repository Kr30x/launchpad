'use client'

import { useState, useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { TileData } from '../page'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  const [isDragging, setIsDragging] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [{ handlerId }, drop] = useDrop<{ index: number }, void, { handlerId: string | symbol | null }>({
    accept: 'tile',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    drop(item) {
      if (item.index !== index) {
        console.log('Dropping tile:', item.index, 'onto:', index)
        moveTile(item.index, index)
      }
    }
  })

  const [{ isDragging: isCurrentlyDragging }, drag] = useDrag({
    type: 'tile',
    item: () => {
      console.log('Started dragging tile at index:', index)
      setIsDragging(true)
      return { id: tile.id, index }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      setIsDragging(false)
      const didDrop = monitor.didDrop()
      if (!didDrop) {
        console.log('Drag cancelled')
      }
    },
  })

  const dragDropRef = drag(drop(ref))

  const handleSave = () => {
    updateTile({ ...editedTile, position: tile.position })
    setIsEditing(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!isCurrentlyDragging && !e.defaultPrevented) {
      window.open(tile.url, '_blank')
    }
  }

  return (
    <>
      <div
        ref={ref}
        onClick={handleClick}
        style={{ backgroundColor: tile.backgroundColor || 'white' }}
        className={`group relative p-2 rounded-lg shadow-sm cursor-move aspect-square w-full h-full
          hover:shadow-md transition-all duration-200 
          ${isCurrentlyDragging ? 'opacity-50' : ''}`}
        data-handler-id={handlerId}
      >
        <div className="flex items-center justify-center h-full w-full">
          {tile.icon && (
            <img
              src={tile.icon}
              alt="Icon"
              className="w-10 h-10 object-contain transition-transform duration-200 group-hover:scale-110"
              draggable={false}
            />
          )}
        </div>
        
        <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              deleteTile(tile.id)
            }}
            className="w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF4A47] 
              transition-colors duration-200 shadow-sm
              flex items-center justify-center group/button"
          >
            <span className="opacity-0 group-hover/button:opacity-100 text-[8px] text-[#800000]">×</span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsEditing(true)
            }}
            className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:bg-[#FFB214] 
              transition-colors duration-200 shadow-sm
              flex items-center justify-center group/button"
          >
            <span className="opacity-0 group-hover/button:opacity-100 text-[8px] text-[#805B17]">●</span>
          </button>
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl w-full min-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Tile</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 p-6">
            <Input
              type="url"
              value={editedTile.url}
              onChange={(e) => setEditedTile({ ...editedTile, url: e.target.value })}
              placeholder="URL"
              className="mb-4"
              required
            />
            <Input
              type="text"
              value={editedTile.icon}
              onChange={(e) => setEditedTile({ ...editedTile, icon: e.target.value })}
              placeholder="Icon path"
              className="mb-4"
            />
            <div className="mb-6">
              <label className="block text-sm text-gray-500 mb-1">Background Color:</label>
              <Input
                type="color"
                value={editedTile.backgroundColor || '#ffffff'}
                onChange={(e) => setEditedTile({ ...editedTile, backgroundColor: e.target.value })}
                className="w-full h-10"
              />
            </div>
            
            {editedTile.icon && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">Preview:</p>
                <div 
                  className="w-full h-[200px] rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: editedTile.backgroundColor }}
                >
                  <img
                    src={editedTile.icon}
                    alt="Icon preview"
                    className="w-20 h-20 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
